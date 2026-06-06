## Feature Information

- Feature Name: Orders, Disputes, Refunds, And Finance
- Description / Goal: Let operators supervise transactions, disputes, refunds,
  commission, payouts, subscriptions, invoices, tax, and Stripe sync.
- Screens Involved: `/orders`, `/orders/[id]`, `/disputes`,
  `/disputes/[id]`, `/refunds`, `/finance`, `/finance/*`.
- User Inputs: Filters, order/detail navigation, dispute decisions, refund
  review, finance drill-downs.
- Backend/API Interactions: `/me/orders` currently; future `/admin/orders`,
  finance analytics, Stripe webhook endpoints.
- Special Conditions / Rules: Commission is 5 percent seller-side; money values
  are stored in cents.
- Additional Notes: Finance summary is currently client-aggregated.

---

# Orders, Disputes, Refunds, And Finance

## Purpose

This feature group gives operators a financial and operational view of
transactions, conflicts, refunds, commission, payouts, and recurring/one-off
revenue.

## Entry Points

- Sidebar orders, disputes, refunds, or finance links
- Dashboard finance/order metric
- User transaction tab
- Search result

## Preconditions

- Admin has operations or finance permission.
- Orders and payment state are persisted.
- Stripe integration exists before real payment workflows launch.

## Main User Flow

### Step 1 - Review Orders Or Finance Overview

User:

- Opens orders or finance screen and applies filters.

System:

- Loads paginated orders or aggregate finance metrics.

### Step 2 - Inspect Transaction Context

User:

- Opens order or dispute detail.

System:

- Shows buyer, seller, listing snapshot, payment, handoff, timeline, fees, and
  dispute context.

### Step 3 - Resolve Operational Work

User:

- Reviews dispute/refund/payout context.

System:

- Persists authorized state changes and records audit/payment events.

## Alternate Flows

- Finance operator reviews subscriptions, invoices, tax, or Stripe sync.
- Admin filters only refunded or disputed orders.
- Payment provider webhook updates order state.

## Edge Cases & Failure Scenarios

- Payment state differs from local order state.
- Duplicate webhook is received.
- Refund attempt fails at provider.
- Buyer or seller account is suspended during an order.
- Finance aggregate endpoint is stale or unavailable.

## Success State

Transaction state, finance totals, and operational queues reflect the latest
backend and payment-provider truth.

## Failure State

Failed operations leave order/payment state unchanged or explicitly marked for
manual review.

## Backend / API Notes

- Replace temporary `/me/orders` admin usage with `/admin/orders`.
- Store amount, fee, deposit, payout, subscription, and boost values in cents.
- Stripe webhooks should run server-side and be idempotent.
- Finance analytics should eventually be backend-computed.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_order_opened` | Order detail opened | `orderId, status` |
| `admin_dispute_opened` | Dispute detail opened | `disputeId, orderId` |
| `admin_refund_reviewed` | Refund reviewed | `orderId, result` |
| `admin_finance_viewed` | Finance module opened | `section` |

## Security & Validation Considerations

- Finance data should be limited to finance/admin roles.
- Never trust client-calculated commission for settlement.
- Webhook signatures must be verified.
- Duplicate payment/refund actions require idempotency keys.

## Technical Notes / Engineering Considerations

- Index orders by buyer, seller, status, and created date.
- Use short transactions around state transitions.
- Keep provider events in an append-only table for reconciliation.

## QA Testing Recommendations

- Order list/detail.
- Status filters.
- Dispute detail with missing optional messages.
- Refund success/failure.
- Duplicate webhook handling.
- Commission calculation at 5 percent.

## Open Questions

- What is the canonical order state machine?
- Which finance actions are read-only for MVP versus executable?

