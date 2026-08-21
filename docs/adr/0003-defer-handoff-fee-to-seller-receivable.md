# ADR-0003 — Defer the handoff-sale platform fee to a seller receivable

Status: Accepted (2026-08-21)

## Context

Issue #36 (mobile) adds a no-card "remise en main propre" purchase path: the
item price is settled in cash, in person, between buyer and seller — no
payment moves through the platform. Issue #30's buyer-protection fee (5%,
deducted from seller proceeds) is charged today by deducting it from the
Stripe Connect transfer at capture time; a handoff sale has no capture to
deduct from.

Shipping the handoff path with a $0 platform fee (the original #36 design)
creates a real incentive problem: card checkout already costs the buyer
~5% + €0.95 (see `fees.ts` / `checkout/[listingId].tsx`), so once both a
free and a paid path exist side by side for the same `VENTE` listings, a
rational buyer/seller pair has no reason to ever choose card. That would
cannibalize the platform's only revenue line on sale listings, not just
carve out a small cash-sale niche.

Two mechanisms could collect the fee anyway without a $0 fallback:
building it into the item price is not possible (the price is agreed
in person, off-platform), and charging *either* party's card at
confirmation time is possible today (`payments-create-intent` already
works without Stripe Connect or Didit KYC, since a flat platform-only
charge has no destination transfer) but reintroduces "a card is charged"
into a flow whose entire acceptance criteria (#36 AC2) is "no card will
be charged." Charging the seller specifically would also mean collecting
payment info from sellers for the first time — today they only ever
*receive* money, once #35/Connect exists.

## Decision

**Defer collection.** Record the fee as an owed amount — a receivable
against the seller — at handoff-order-creation time, collecting nothing
from anyone today. The debt is settled automatically out of that seller's
first real Stripe Connect payout once #35/Connect ships (settlement logic
itself is #35's scope, not this ADR's — see SCR-019).

This keeps #36's "no card charged" guarantee intact, requires no new
payment collection surface today, and matches how the fee already works
conceptually (`calculateSellerNet` — deducted from seller proceeds, not
billed to the buyer). The trade-off is real and accepted: if a seller
never completes another card sale, the receivable is never collected —
there is no dunning/collections flow, and building one is explicitly out
of scope until it's shown to matter at volume.

## Considered options

- **$0 fee on handoff (original #36 design).** Simplest, ships fastest,
  literally matches "no card charged." Rejected: undermines the platform's
  entire card-fee revenue on `VENTE` listings, not a narrow niche cost.
- **Flat platform fee charged to the buyer's card at confirmation**
  (decoupled from the cash item price). Buildable today with zero new
  infra (buyers already provide a card in the existing checkout). Rejected
  for v1: contradicts #36 AC2 verbatim ("no card will be charged"); revisit
  if the deferred-receivable model proves uncollectible at scale.
- **Flat platform fee charged to the seller's card at confirmation.** Same
  mechanism, seller-side. Rejected: requires collecting seller payment
  info for the first time, ahead of and independent from the Connect
  onboarding #35 will eventually require anyway.
- **Deferred receivable, settled at next Connect payout (chosen).** No
  card touched now; fee lands where #30 already conceptually places it
  (seller proceeds). Accepted with the uncollectible-debt trade-off above.

## Consequences

- New schema: `public.seller_fee_receivables`, one row per handoff order,
  `OUTSTANDING` until a future payout settles it. See SCR-019 for the full
  design (this ADR is the business rationale; SCR-019 is the technical spec
  and carries the actual migration).
- `orders-create`'s handoff branch (built for #36) additionally inserts one
  receivable row per order — see SCR-019's Edge Function section.
- **No settlement path exists yet.** Receivables accumulate as
  `OUTSTANDING` with nothing consuming them until #35/Connect ships and
  implements the payout-time deduction. This is intentional, not an
  oversight — flagging it loudly so nobody assumes the fee is actually
  being collected before #35 lands.
- If uncollected-receivable volume turns out to matter before #35 ships,
  revisit this ADR — the buyer-flat-fee option above is the fallback,
  not a full redesign.
