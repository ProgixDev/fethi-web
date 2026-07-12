-- SCR-011 — App entitlements + store transactions (IAP rail for MyStreet+).
-- Digital entitlements delivered via Apple IAP / Google Play Billing through
-- RevenueCat — kept strictly separate from the Stripe marketplace money rail
-- (Apple 3.1.5(a): digital goods must not use Stripe in-app). Consumed by
-- mobile TASK-015.
-- Additive, forward-only. See docs/db/decisions/SCR-011.md.

-- ===========================================================================
-- app_entitlements — the CURRENT entitlement state per (user, entitlement_key).
-- Readable by the owning user; written ONLY by trusted store-validation logic
-- (the RevenueCat webhook Edge Function, service role). The client never writes
-- here — a client-side "is plus" flag is a cache only, never the source of truth.
--
-- `entitlement_key` values are the RevenueCat entitlement identifiers the app
-- gates on, e.g. 'plus' (MyStreet+), 'custom_radius', 'boost'.
-- ===========================================================================
create table public.app_entitlements (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  entitlement_key    text not null,
  is_active          boolean not null default false,
  product_id         text,
  platform           text,                 -- 'ios' | 'android' | null
  store              text,                 -- 'app_store' | 'play_store' | 'revenuecat'
  period_type        text,                 -- 'trial' | 'intro' | 'normal'
  will_renew         boolean,
  expires_at         timestamptz,          -- null = non-expiring / lifetime
  latest_transaction_id text,
  metadata           jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- One row per entitlement per user → the webhook upserts on this pair.
  unique (user_id, entitlement_key)
);

-- Feature-gating reads look up (user_id, entitlement_key) → back the unique
-- constraint with the matching index the migration plan calls for.
create index app_entitlements_user_key_idx
  on public.app_entitlements (user_id, entitlement_key);

alter table public.app_entitlements enable row level security;

-- Owner may READ their entitlements. No INSERT/UPDATE/DELETE policy exists →
-- RLS denies all client writes; only the service role (RLS-bypassing, used by
-- the webhook Edge Function) mutates this table. Mirrors payout_accounts.
create policy app_entitlements_select_self
  on public.app_entitlements
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ===========================================================================
-- app_store_transactions — append-only audit of every validated store
-- transaction/event delivered by the provider webhook. Deduped by the provider
-- transaction id per platform so at-least-once webhook delivery can't double
-- record. Written ONLY by the service role; readable own-row for support/UI.
-- ===========================================================================
create table public.app_store_transactions (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles(id) on delete set null,
  platform           text not null,        -- 'ios' | 'android'
  transaction_id     text not null,        -- provider/store transaction id
  product_id         text,
  entitlement_key    text,
  event_type         text,                 -- INITIAL_PURCHASE | RENEWAL | CANCELLATION | EXPIRATION | ...
  environment        text,                 -- 'SANDBOX' | 'PRODUCTION'
  store              text,
  price_cents        integer,
  currency           text,
  purchased_at       timestamptz,
  expires_at         timestamptz,
  raw                jsonb,                 -- full webhook event, for audit/replay
  created_at         timestamptz not null default now(),
  -- Idempotency: one row per provider transaction per platform.
  unique (platform, transaction_id)
);

create index app_store_transactions_user_idx
  on public.app_store_transactions (user_id, created_at desc);

alter table public.app_store_transactions enable row level security;

-- Owner may READ their own transactions. No client write policy → service-role
-- (webhook) only, same trusted-write model as app_entitlements.
create policy app_store_transactions_select_self
  on public.app_store_transactions
  for select
  to authenticated
  using (user_id = (select auth.uid()));
