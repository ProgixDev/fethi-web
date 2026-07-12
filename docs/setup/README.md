# Setup guides

External / one-time setup needed to make the built backend work end to end.
The code + DB + Edge Functions are deployed; these steps supply the accounts,
secrets, and dashboard wiring they depend on.

| Guide | Rail | Blocking work |
| --- | --- | --- |
| [stripe-connect.md](./stripe-connect.md) | Physical-goods marketplace (Stripe Connect) | set `STRIPE_*` secrets, enable Connect, register the webhook + its 6 events, onboard sellers |
| [revenuecat-iap.md](./revenuecat-iap.md) | Digital entitlements — MyStreet+ / radius / boosts (Apple IAP / Play Billing via RevenueCat) | RevenueCat account + keys, store products, `REVENUECAT_WEBHOOK_AUTH`, a native build, mobile client wiring (TASK-015) |

**Rail separation is deliberate:** physical items → Stripe; digital entitlements
→ store billing/RevenueCat (Apple 3.1.1 / 3.1.5(a)). The two never share a table,
function, or payment path.

## Edge secrets at a glance

| Secret | Guide | Status |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe | set per handoff |
| `STRIPE_WEBHOOK_SECRET` | Stripe | set per handoff (re-issue if the endpoint is recreated) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | set per handoff |
| `EXPO_ACCESS_TOKEN` | push (notifications-dispatch) | set per handoff |
| `REVENUECAT_WEBHOOK_AUTH` | RevenueCat | **not set** — arms `revenuecat-webhook` |
