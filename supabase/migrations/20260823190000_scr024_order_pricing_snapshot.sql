-- SCR-024: immutable pricing snapshot used by receipts and reconciliation.

alter table public.orders
  add column if not exists pricing_version text not null default 'legacy-v0',
  add column if not exists item_cents integer not null default 0,
  add column if not exists buyer_fee_cents integer not null default 0,
  add column if not exists tax_cents integer not null default 0,
  add column if not exists seller_fee_cents integer not null default 0,
  add column if not exists payment_method text not null default 'card';

-- Old card orders used fee_cents as a buyer surcharge. Preserve that actual
-- historical money movement instead of rewriting old receipts as the new model.
update public.orders
set item_cents = greatest(amount_cents - fee_cents, 0),
    buyer_fee_cents = fee_cents,
    tax_cents = 0,
    seller_fee_cents = 0,
    payment_method = 'card'
where pricing_version = 'legacy-v0';

-- Handoff orders can be identified authoritatively by their fee receivable.
update public.orders o
set item_cents = o.amount_cents,
    buyer_fee_cents = 0,
    seller_fee_cents = r.amount_cents,
    payment_method = 'handoff'
from public.seller_fee_receivables r
where r.order_id = o.id
  and o.pricing_version = 'legacy-v0';

alter table public.orders
  add constraint orders_pricing_amounts_nonnegative check (
    item_cents >= 0 and buyer_fee_cents >= 0 and tax_cents >= 0 and
    seller_fee_cents >= 0
  ),
  add constraint orders_payment_method_check check (
    payment_method in ('card', 'handoff')
  );

comment on column public.orders.pricing_version is
  'Version of the immutable server pricing snapshot used for checkout/receipt reconciliation.';
comment on column public.orders.seller_fee_cents is
  'Seller commission for every payment method; unlike fee_cents, also populated for handoff orders.';
