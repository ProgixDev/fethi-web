# Setup — Stripe Connect (marketplace money rail)

How to make the **physical-goods** payment rail work end to end: buyers pay,
the platform takes a fee, sellers get paid via Stripe Connect Express, and
refunds unwind cleanly. This rail is **only** for marketplace item payments —
digital goods (MyStreet+, boosts) go through the IAP rail, see
[`revenuecat-iap.md`](./revenuecat-iap.md).

Project ref: `lksjbehxpfndviesnlgm` · Edge base URL:
`https://lksjbehxpfndviesnlgm.supabase.co/functions/v1`

## 0. What's already built (no action needed)

| Piece | Slug / table | Notes |
| --- | --- | --- |
| Publishable-key config | `payments-config` | mobile reads it at boot |
| PaymentIntent creation | `payments-create-intent` | destination charge, 5% app fee, server-authoritative amount |
| Seller onboarding | `connect-onboarding` | Express + Account Links |
| Webhook handler | `stripe-webhook` | payment / refund / dispute / account events |
| Tables | `orders`, `payments`, `payout_accounts` | own-row RLS, service-role writes |

## 1. Edge secrets (required)

Set these on the Supabase project (Dashboard → Project Settings → Edge Functions
→ Secrets, or `supabase secrets set KEY=value --project-ref lksjbehxpfndviesnlgm`;
locally the Docker/CLI-link path is blocked — use the Dashboard or the Management
API per the `progix-supabase-apply-path` playbook):

| Secret | Where it's used | Value |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | all Stripe Edge Functions | `sk_test_…` (test) / `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | from the webhook endpoint (step 3) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `payments-config` | `pk_test_…` / `pk_live_…` |

Until `STRIPE_SECRET_KEY` is set, the Stripe functions return `503
stripe_unconfigured` (inert, safe).

## 2. Enable Connect (Express)

Stripe Dashboard → **Connect** → get started → platform profile. Enable the
**Express** account type and the **`card_payments`** + **`transfers`**
capabilities (the onboarding function requests both). No Connect client-id is
needed — the Express + Account-Links flow only uses `STRIPE_SECRET_KEY`.

## 3. Register the webhook endpoint

Dashboard → **Developers → Webhooks → Add endpoint**:

- **URL:** `https://lksjbehxpfndviesnlgm.supabase.co/functions/v1/stripe-webhook`
- **Events** (exactly the 6 the handler processes):
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `charge.refund.updated`
  - `charge.dispute.created`
  - `account.updated`
- Copy the endpoint's **Signing secret** (`whsec_…`) → set as
  `STRIPE_WEBHOOK_SECRET` (step 1).

The handler verifies the signature, dedupes by `stripe_event_id`, and — since
SCR-012 — **rolls back its dedup claim if processing fails**, so a failed event
is retried by Stripe instead of being silently dropped.

## 4. Money flow (how it behaves once configured)

1. Buyer creates an order → `orders-create` computes the amount server-side
   (listing price + params + 5% fee; sale fee floor 0.95€) and records
   `amount_cents` / `fee_cents`.
2. Buyer pays → `payments-create-intent` makes a **destination charge**:
   `transfer_data.destination` = the seller's Connect account,
   `application_fee_amount` = `fee_cents`. **The seller must be onboarded**
   (`payout_accounts.onboarding_status = 'ENABLED'`) or the call returns
   `409 seller_payout_not_ready` and the purchase is blocked.
3. Webhook flips `orders.payment_status = SUCCEEDED`.
4. Handoff: both parties confirm pickup → `orders-transition` moves the order to
   COMPLETED — but a Stripe order **can't confirm until paid** (`409
   payment_not_completed`).
5. Refund (admin, `repos.orders.refund`): sets `reverse_transfer=true` +
   `refund_application_fee=true` so the seller's share and the platform fee are
   both clawed back.

## 5. Seller onboarding

The seller taps "become a seller" in the app → `connectApi.startOnboarding` →
hosted Stripe onboarding (KYC/IBAN). The `account.updated` webhook flips
`payout_accounts` to `ENABLED` when `payouts_enabled` is true. Only then are
their listings purchasable.

> Note: `connect-onboarding` currently sends a placeholder email
> (`<uid>@mystreet.temp`) and hardcodes `country: 'FR'` — replace with the real
> profile email/country before production KYC (tracked).

## 6. Verify (test mode)

1. Set the test secrets + register the webhook.
2. Onboard a test seller (use Stripe's test onboarding values) → confirm
   `payout_accounts.onboarding_status = 'ENABLED'`.
3. Buy that seller's listing with card `4242 4242 4242 4242` → PaymentSheet
   succeeds → `stripe-webhook` sets the order `SUCCEEDED` → check the transfer +
   application fee in the Stripe Dashboard.
4. Refund from the admin order page → confirm the seller transfer is reversed.

Test cards: success `4242 4242 4242 4242` · requires-auth `4000 0025 0000 3155`
· decline `4000 0000 0000 0002`.

## 7. Known gaps (tracked, not blocking)

- **`charge.dispute.closed` is not handled** — orders flip to `DISPUTED` on
  `dispute.created` but never un-flip when the dispute resolves. Add a
  `dispute.closed` case (won → back to SUCCEEDED, lost → keep/REFUNDED).
- **Immediate capture** (no escrow) — money is captured at purchase, not on
  handoff (product decision, WEB-017 A3). Revisit if buyer protection is needed.
