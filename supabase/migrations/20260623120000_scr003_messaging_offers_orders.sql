-- SCR-003 — Messaging / offers / orders transactional core.
-- threads, messages, message_attachments, offers, orders, order_events
-- + native enums + RLS + Realtime + an idempotency ledger.
-- Additive, forward-only. See docs/db/decisions/SCR-003.md.
-- Enum values are dictated by the shipped mobile contract
-- (fethi-mobile/src/shared/lib/api.ts): OfferStatus, ApiOrderStatus, MessageKind.
-- Never rename an enum value or column the mobile app reads — only ADD VALUE.

-- ===========================================================================
-- Enums (values match shipped mobile api.ts — do not rename, only ADD VALUE)
-- ===========================================================================
-- mobile OfferStatus
create type public.offer_status as enum
  ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');
-- mobile ApiOrderStatus
create type public.order_status as enum
  ('AWAITING_PICKUP', 'HANDOFF_PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED');
-- mobile MessageKind
create type public.message_kind as enum
  ('TEXT', 'PHOTO', 'LOCATION', 'OFFER', 'PICKUP', 'SYSTEM');

-- ===========================================================================
-- threads  (one conversation per (listing, buyer); seller derived from listing)
-- ApiThread: id, listingId, iAmSeller (derived), other, lastMessage*, createdAt.
-- Buyer + seller are the only two participants; we store both ids so RLS and the
-- buyer_id/seller_id indexes in the migration plan are cheap. A thread_participants
-- join table is intentionally omitted: the marketplace conversation is strictly
-- 1:1 (buyer ↔ listing-owner), so two columns are clearer + index-friendlier than
-- a join table. (See SCR-003 §Decisions.)
-- ===========================================================================
create table public.threads (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references public.listings (id) on delete cascade,
  buyer_id        uuid not null references public.profiles (id) on delete cascade,
  seller_id       uuid not null references public.profiles (id) on delete cascade,
  last_message    text,
  last_message_at timestamptz,
  last_sender_id  uuid references public.profiles (id) on delete set null,
  -- per-participant unread counters maintained by the new-message trigger
  buyer_unread    integer not null default 0,
  seller_unread   integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- a buyer cannot open two threads on the same listing ("open or retrieve")
  constraint threads_unique_listing_buyer unique (listing_id, buyer_id),
  -- the buyer is never the seller of their own listing
  constraint threads_buyer_not_seller check (buyer_id <> seller_id)
);

create index threads_listing_idx on public.threads (listing_id);
create index threads_buyer_idx   on public.threads (buyer_id, last_message_at desc);
create index threads_seller_idx  on public.threads (seller_id, last_message_at desc);

create trigger threads_touch_updated_at
  before update on public.threads
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- is_thread_participant — SECURITY DEFINER so message RLS can gate on thread
-- membership WITHOUT a recursive read of threads' own RLS and without a per-row
-- auth.uid() call. Mirrors the SCR-002 is_staff/has_staff_role pattern.
-- ---------------------------------------------------------------------------
create or replace function public.is_thread_participant(p_thread_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.threads t
    where t.id = p_thread_id
      and (t.buyer_id = p_uid or t.seller_id = p_uid)
  );
$$;

revoke execute on function public.is_thread_participant(uuid, uuid) from public;
grant execute on function public.is_thread_participant(uuid, uuid) to authenticated, service_role;

-- ===========================================================================
-- messages  (ApiMessage: id, threadId, senderId, kind, text, imageUrl, createdAt)
-- ===========================================================================
create table public.messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.threads (id) on delete cascade,
  sender_id   uuid not null references public.profiles (id) on delete cascade,
  kind        public.message_kind not null default 'TEXT',
  text        text,
  image_url   text,
  -- optional structured payload for OFFER/LOCATION/PICKUP system messages
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- migration-plan index: messages(thread_id, created_at)
create index messages_thread_created_idx on public.messages (thread_id, created_at);

-- maintain threads.last_message* + per-participant unread on each new message
create or replace function public.sync_thread_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer  uuid;
  v_seller uuid;
begin
  select buyer_id, seller_id into v_buyer, v_seller
    from public.threads where id = new.thread_id;

  update public.threads
     set last_message    = coalesce(new.text, '[' || new.kind::text || ']'),
         last_message_at = new.created_at,
         last_sender_id  = new.sender_id,
         -- increment the OTHER party's unread counter
         buyer_unread    = buyer_unread  + (case when new.sender_id = v_buyer  then 0 else 1 end),
         seller_unread   = seller_unread + (case when new.sender_id = v_seller then 0 else 1 end),
         updated_at      = now()
   where id = new.thread_id;
  return null;
end;
$$;

create trigger messages_sync_thread
  after insert on public.messages
  for each row execute function public.sync_thread_on_message();

-- ===========================================================================
-- message_attachments  (multipart photo uploads etc.; mobile sendPhoto)
-- ===========================================================================
create table public.message_attachments (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references public.messages (id) on delete cascade,
  storage_path  text not null,
  content_type  text,
  width         integer check (width  is null or width  >= 0),
  height        integer check (height is null or height >= 0),
  byte_size     bigint  check (byte_size is null or byte_size >= 0),
  created_at    timestamptz not null default now()
);

create index message_attachments_message_idx on public.message_attachments (message_id);

-- ===========================================================================
-- offers  (OfferResponse: id, listingId, buyerId, sellerId, amountCents, message,
--          status, responseMessage, respondedAt, expiresAt, createdAt)
-- State machine is enforced by the offers-respond Edge Function (service role),
-- NOT by raw client writes — RLS lets a buyer INSERT a PENDING offer but never
-- mutate status directly (see RLS below).
-- ===========================================================================
create table public.offers (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.listings (id) on delete cascade,
  buyer_id         uuid not null references public.profiles (id) on delete cascade,
  seller_id        uuid not null references public.profiles (id) on delete cascade,
  amount_cents     integer not null check (amount_cents >= 0),
  message          text,
  status           public.offer_status not null default 'PENDING',
  response_message text,
  responded_at     timestamptz,
  expires_at       timestamptz not null default (now() + interval '48 hours'),
  -- once accepted, the order this offer produced (set by the offer→order fn)
  order_id         uuid,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint offers_buyer_not_seller check (buyer_id <> seller_id)
);

-- migration-plan index: offers(listing_id, buyer_id, status)
create index offers_listing_buyer_status_idx on public.offers (listing_id, buyer_id, status);
create index offers_seller_status_idx on public.offers (seller_id, status);
-- at most one LIVE (PENDING) offer per buyer per listing
create unique index offers_one_live_per_buyer_listing
  on public.offers (listing_id, buyer_id)
  where status = 'PENDING';

create trigger offers_touch_updated_at
  before update on public.offers
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- orders  (ApiOrder shape) — created by the offer→order Edge Function or direct
-- buy. Status transitions run as service role in the order-transition fn.
-- ===========================================================================
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  buyer_id            uuid not null references public.profiles (id) on delete restrict,
  seller_id           uuid not null references public.profiles (id) on delete restrict,
  listing_id          uuid not null references public.listings (id) on delete restrict,
  -- denormalised listing snapshot (mobile reads listingTitle/Thumb/Type on the order)
  listing_title       text,
  listing_thumb       text,
  listing_type        public.listing_type not null,
  amount_cents        integer not null check (amount_cents >= 0),
  fee_cents           integer not null default 0 check (fee_cents >= 0),
  deposit_cents       integer check (deposit_cents is null or deposit_cents >= 0),
  rental_start        timestamptz,
  rental_end          timestamptz,
  status              public.order_status not null default 'AWAITING_PICKUP',
  buyer_confirmed     boolean not null default false,
  seller_confirmed    boolean not null default false,
  deposit_released    boolean,
  cancelled_by        uuid references public.profiles (id) on delete set null,
  cancellation_reason text,
  -- offer this order originated from, if any
  offer_id            uuid references public.offers (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz,
  cancelled_at        timestamptz,
  constraint orders_buyer_not_seller check (buyer_id <> seller_id),
  constraint orders_rental_range check (
    rental_start is null or rental_end is null or rental_end >= rental_start
  )
);

-- migration-plan indexes
create index orders_buyer_created_idx  on public.orders (buyer_id, created_at desc);
create index orders_seller_created_idx on public.orders (seller_id, created_at desc);
create index orders_status_idx         on public.orders (status);
create index orders_listing_idx        on public.orders (listing_id);

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- now that orders exists, close the offers.order_id FK (additive)
alter table public.offers
  add constraint offers_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete set null;

-- ===========================================================================
-- order_events  (immutable audit trail of every order transition)
-- ===========================================================================
create table public.order_events (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  actor_id     uuid references public.profiles (id) on delete set null,
  from_status  public.order_status,
  to_status    public.order_status not null,
  note         text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

-- ===========================================================================
-- idempotency_keys  (backs the Idempotency-Key header so transition-fn retries
-- never duplicate an order / double-apply a transition). Service-role only.
-- ===========================================================================
create table public.idempotency_keys (
  key          text not null,
  scope        text not null,            -- e.g. 'orders.create', 'offers.respond'
  user_id      uuid references public.profiles (id) on delete cascade,
  response     jsonb,                    -- cached response body to replay
  created_at   timestamptz not null default now(),
  primary key (scope, key)
);

create index idempotency_keys_created_idx on public.idempotency_keys (created_at);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.threads             enable row level security;
alter table public.messages            enable row level security;
alter table public.message_attachments enable row level security;
alter table public.offers              enable row level security;
alter table public.orders              enable row level security;
alter table public.order_events        enable row level security;
alter table public.idempotency_keys    enable row level security;

-- ---- threads: only the two participants read; only the buyer opens a thread.
-- Updates (last_message, unread) happen via triggers / service role, never a raw
-- client UPDATE, so there is intentionally NO update policy.
create policy threads_select_participant on public.threads
  for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));
create policy threads_insert_buyer on public.threads
  for insert to authenticated
  with check (
    (select auth.uid()) = buyer_id
    and buyer_id <> seller_id
    -- the named seller must actually own the listing
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = seller_id
    )
  );

-- ---- messages: participants read; a participant inserts only as themselves.
create policy messages_select_participant on public.messages
  for select to authenticated
  using ((select public.is_thread_participant(thread_id, (select auth.uid()))));
create policy messages_insert_participant on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.is_thread_participant(thread_id, (select auth.uid())))
  );

-- ---- message_attachments: visible/writable iff the parent message's thread is
-- one the caller participates in; the author owns the message.
create policy message_attachments_select on public.message_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and (select public.is_thread_participant(m.thread_id, (select auth.uid())))
    )
  );
create policy message_attachments_insert on public.message_attachments
  for insert to authenticated
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id
        and m.sender_id = (select auth.uid())
    )
  );

-- ---- offers: buyer + seller (= listing owner) read; buyer creates a PENDING
-- offer as themselves on someone else's listing. Status changes are service-role
-- only (the offers-respond Edge Function) — no client UPDATE/DELETE policy.
create policy offers_select_party on public.offers
  for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));
create policy offers_insert_buyer on public.offers
  for insert to authenticated
  with check (
    buyer_id = (select auth.uid())
    and status = 'PENDING'
    and buyer_id <> seller_id
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = seller_id
    )
  );

-- ---- orders: buyer + seller read their order; ALL mutations go through the
-- order-transition Edge Function (service role). No client write policy — raw
-- clients can never create or transition an order directly.
create policy orders_select_party on public.orders
  for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

-- ---- order_events: readable by the order's parties; writes service-role only.
create policy order_events_select_party on public.order_events
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (select auth.uid()) in (o.buyer_id, o.seller_id)
    )
  );

-- ---- idempotency_keys: service-role only. RLS enabled with NO policy => the
-- anon/authenticated roles see nothing; only the service role (which bypasses
-- RLS) reads/writes it from the Edge Functions.

-- ===========================================================================
-- Realtime — mobile subscribes to new messages, narrowed by thread_id.
-- Add the tables mobile listens on to the supabase_realtime publication.
-- ===========================================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.threads;
alter publication supabase_realtime add table public.offers;
alter publication supabase_realtime add table public.orders;
