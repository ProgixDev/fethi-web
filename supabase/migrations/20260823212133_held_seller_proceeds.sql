-- SCR-025 — held seller proceeds for card marketplace purchases (mobile #35).
--
-- Card charges settle on the platform.  A Stripe Transfer is created only after
-- an authenticated buyer confirms receipt (immediately below €500, 48h later at
-- or above €500).  This is a payment-flow hold, not a legal escrow service.

create type public.proceeds_hold_status as enum (
  'HELD',
  'RELEASE_PENDING',
  'RELEASING',
  'RELEASED',
  'REFUNDED',
  'DISPUTED',
  'CANCELLED',
  'REVIEW_REQUIRED'
);

create table public.held_seller_proceeds (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null unique references public.orders (id) on delete cascade,
  seller_id                uuid not null references public.profiles (id) on delete restrict,
  -- The Stripe Charge is retained so the later Transfer can use source_transaction.
  stripe_charge_id         text not null unique,
  stripe_transfer_id       text unique,
  gross_cents              integer not null check (gross_cents > 0),
  seller_net_cents         integer not null check (seller_net_cents >= 0),
  platform_fee_cents       integer not null check (platform_fee_cents >= 0),
  settled_receivable_cents integer not null default 0 check (settled_receivable_cents >= 0),
  status                   public.proceeds_hold_status not null default 'HELD',
  buyer_confirmed_at       timestamptz,
  release_after            timestamptz,
  review_after             timestamptz not null default (now() + interval '7 days'),
  released_at              timestamptz,
  terminal_reason          text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint held_seller_proceeds_money_check check (
    seller_net_cents + platform_fee_cents <= gross_cents
  ),
  constraint held_seller_proceeds_release_check check (
    (status = 'RELEASED' and stripe_transfer_id is not null and released_at is not null)
    or status <> 'RELEASED'
  )
);

create index held_seller_proceeds_seller_status_idx
  on public.held_seller_proceeds (seller_id, status, created_at desc);
create index held_seller_proceeds_reconcile_idx
  on public.held_seller_proceeds (status, release_after, review_after)
  where status in ('HELD', 'RELEASE_PENDING');

create trigger held_seller_proceeds_touch_updated_at
  before update on public.held_seller_proceeds
  for each row execute function public.touch_updated_at();

alter table public.held_seller_proceeds enable row level security;

-- Both parties may see the lifecycle, but no client can alter money state.
create policy held_seller_proceeds_select_parties
  on public.held_seller_proceeds for select
  to authenticated
  using (
    seller_id = (select auth.uid())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.buyer_id = (select auth.uid())
    )
  );

alter publication supabase_realtime add table public.held_seller_proceeds;
