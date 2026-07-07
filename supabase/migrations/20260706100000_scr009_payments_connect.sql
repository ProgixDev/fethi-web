-- SCR-009 — Stripe Payments + Connect Express (shared payment backend).
-- payments table, payout_accounts table, webhook deduplication, payment columns on orders.
-- Additive, forward-only. See docs/db/decisions/SCR-009.md.

-- ===========================================================================
-- payment_status enum — matches Stripe PaymentIntent lifecycle
-- ===========================================================================
create type public.payment_status as enum
  ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'DISPUTED', 'PARTIALLY_REFUNDED');

-- ===========================================================================
-- Add payment columns to orders (nullable for cash/offline orders)
-- ===========================================================================
alter table public.orders
  add column payment_intent_id text,
  add column payment_status public.payment_status,
  add column paid_at timestamptz;

-- Index for payment lookups
create index orders_payment_intent_idx on public.orders (payment_intent_id) where payment_intent_id is not null;
create index orders_payment_status_idx on public.orders (payment_status) where payment_status is not null;

-- ===========================================================================
-- payments — immutable payment records written ONLY by the webhook
-- ===========================================================================
create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  order_id                uuid not null references public.orders (id) on delete cascade,
  stripe_payment_intent_id text not null unique,
  amount_cents            integer not null check (amount_cents >= 0),
  status                  public.payment_status not null,
  metadata                jsonb,
  created_at              timestamptz not null default now()
);

create index payments_order_idx on public.payments (order_id);
create index payments_intent_idx on public.payments (stripe_payment_intent_id);

-- ===========================================================================
-- payout_accounts — seller Stripe Connect accounts
-- ===========================================================================
create table public.payout_accounts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.profiles (id) on delete cascade,
  stripe_account_id   text not null unique,
  onboarding_status   text not null check (onboarding_status in ('PENDING', 'ENABLED', 'RESTRICTED', 'DISABLED')),
  payouts_enabled     boolean not null default false,
  details_submitted   boolean not null default false,
  metadata            jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint payout_accounts_valid_status check (
    (onboarding_status = 'ENABLED' and payouts_enabled = true and details_submitted = true) or
    (onboarding_status != 'ENABLED')
  )
);

create index payout_accounts_user_idx on public.payout_accounts (user_id);
create index payout_accounts_stripe_idx on public.payout_accounts (stripe_account_id);

create trigger payout_accounts_touch_updated_at
  before update on public.payout_accounts
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- webhook_deduplication — at-least-once delivery guard (service-role only)
-- ===========================================================================
create table public.webhook_deduplication (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text not null unique,
  processed_at     timestamptz not null default now()
);

create index webhook_deduplication_event_idx on public.webhook_deduplication (stripe_event_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.payments             enable row level security;
alter table public.payout_accounts      enable row level security;
alter table public.webhook_deduplication enable row level security;

-- ---- payments: buyers/sellers read their own payments via order; service-role writes
create policy payments_select_party on public.payments
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (select auth.uid()) in (o.buyer_id, o.seller_id)
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated — only service role writes

-- ---- payout_accounts: users read their own; service-role writes
create policy payout_accounts_select_self on public.payout_accounts
  for select to authenticated
  using (user_id = (select auth.uid()));

-- No INSERT/UPDATE/DELETE policy for authenticated — only service role writes

-- ---- webhook_deduplication: service-role only (no policies = invisible to clients)

-- ===========================================================================
-- Realtime — mobile subscribes to payment status changes
-- ===========================================================================
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.payout_accounts;
