-- SCR-010 — Notifications + Expo push dispatch (shared notification backend).
-- notifications table (own-row RLS), device_push_tokens table (user+token, upsert-friendly),
-- notif_kind enum matching mobile api.ts, Realtime on notifications.
-- Additive, forward-only. See docs/db/decisions/SCR-010.md.

-- ===========================================================================
-- notif_kind enum — values match shipped mobile api.ts NotifKind EXACTLY.
-- Do not rename existing values; only ADD VALUE in future SCRs.
-- ===========================================================================
create type public.notif_kind as enum (
  'MESSAGE',
  'OFFER',
  'BOOKING_REQUEST',
  'LISTING_SOLD',
  'ORDER_UPDATE',
  'REVIEW',
  'PAYOUT',
  'SYSTEM'
);

-- ===========================================================================
-- notifications — one row per in-app notification, owned by a single user.
-- Written by the server (service role / domain events); read by the owner.
-- `read_at` is the source of truth; `unread` is a generated mirror so the
-- mobile ApiNotification contract (which reads `unread`) maps 1:1 from the row.
-- ===========================================================================
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        public.notif_kind not null,
  title       text not null,
  body        text,
  href        text,
  read_at     timestamptz,
  unread      boolean generated always as (read_at is null) stored,
  created_at  timestamptz not null default now()
);

-- Feed listing: newest-first per user.
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Unread-count lookups (partial index over the small unread set).
create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- ===========================================================================
-- device_push_tokens — Expo push tokens per user device.
-- Keyed by (user_id, token) so mobile can upsert on register and dedupe;
-- the dispatch Edge Function prunes rows on Expo "DeviceNotRegistered".
-- ===========================================================================
create table public.device_push_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  token         text not null,
  platform      text check (platform in ('ios', 'android', 'web')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_used_at  timestamptz,
  constraint device_push_tokens_user_token_key unique (user_id, token)
);

create index device_push_tokens_user_idx on public.device_push_tokens (user_id);
create index device_push_tokens_token_idx on public.device_push_tokens (token);

create trigger device_push_tokens_touch_updated_at
  before update on public.device_push_tokens
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.notifications      enable row level security;
alter table public.device_push_tokens enable row level security;

-- ---- notifications: a user reads ONLY their own rows.
create policy notifications_select_self on public.notifications
  for select to authenticated
  using (user_id = (select auth.uid()));

-- A user may mark their own notifications read (flip read_at). Row must stay
-- owned by the caller. No INSERT/DELETE for authenticated — the server
-- (service role) inserts notifications from domain events.
create policy notifications_update_self on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---- device_push_tokens: a user fully manages ONLY their own device rows
-- (register/upsert, refresh, unregister). Service role prunes dead tokens.
create policy device_push_tokens_select_self on public.device_push_tokens
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy device_push_tokens_insert_self on public.device_push_tokens
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy device_push_tokens_update_self on public.device_push_tokens
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy device_push_tokens_delete_self on public.device_push_tokens
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ===========================================================================
-- Realtime — mobile subscribes to its own notifications for live in-app feed.
-- (RLS still applies to Realtime, so a client only receives its own rows.)
-- ===========================================================================
alter publication supabase_realtime add table public.notifications;
