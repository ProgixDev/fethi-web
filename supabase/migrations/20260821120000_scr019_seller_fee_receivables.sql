-- SCR-019 — seller_fee_receivables (deferred handoff-sale platform fee).
-- Additive, forward-only. See docs/db/decisions/SCR-019.md +
-- docs/adr/0003-defer-handoff-fee-to-seller-receivable.md for the full record.
--
-- A no-card handoff sale (mobile issue #36) moves no money through the
-- platform, so the #30 buyer-protection fee can't be deducted from a Stripe
-- capture the way it is for card sales. This records it as owed instead —
-- one row per handoff order — to be settled out of that seller's first real
-- Stripe Connect payout once issue #35 ships. Settlement logic itself is NOT
-- part of this migration; rows accumulate as OUTSTANDING until #35 consumes
-- them.

create type public.fee_receivable_status as enum ('OUTSTANDING', 'SETTLED', 'WAIVED');

create table public.seller_fee_receivables (
  id             uuid primary key default gen_random_uuid(),
  seller_id      uuid not null references public.profiles (id) on delete cascade,
  order_id       uuid not null references public.orders (id) on delete cascade,
  -- Free-text, not an enum (SCR-018 `rate_limit_hits.scope` precedent) — a
  -- future reason shouldn't need its own migration to add an enum value.
  reason         text not null,
  amount_cents   integer not null check (amount_cents > 0),
  status         public.fee_receivable_status not null default 'OUTSTANDING',
  settled_at     timestamptz,
  -- Free-text reference to whatever cleared it (a Stripe payout id, an admin
  -- note for a manual waive). Populated by #35's settlement logic.
  settled_via    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- v1 scope: exactly one receivable per handoff order. Also gives the
  -- idempotent orders-create call a natural no-op-on-replay guarantee.
  constraint seller_fee_receivables_one_per_order unique (order_id)
);

-- The query #35's settlement logic will run at payout time: "what does this
-- seller currently owe".
create index seller_fee_receivables_seller_outstanding_idx
  on public.seller_fee_receivables (seller_id)
  where status = 'OUTSTANDING';

create trigger seller_fee_receivables_touch_updated_at
  before update on public.seller_fee_receivables
  for each row execute function public.touch_updated_at();

alter table public.seller_fee_receivables enable row level security;

-- A seller can read their own receivables (any status) — supports a future
-- "pending platform fees" view without a dedicated Edge Function just to read
-- this table. No insert/update/delete policy: service-role only writer
-- (orders-create today; a future #35 settlement job later), same pattern as
-- orders/offers/idempotency_keys.
create policy seller_fee_receivables_select_own
  on public.seller_fee_receivables for select
  to authenticated
  using (seller_id = auth.uid());
