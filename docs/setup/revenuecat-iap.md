# Setup — RevenueCat IAP (digital entitlements)

How to make the **digital-entitlement** rail work: MyStreet+, the custom-radius
perk, and listing boosts sold via **Apple In-App Purchase / Google Play Billing**
through **RevenueCat**. This is kept strictly separate from Stripe — Apple
Guideline 3.1.1 / 3.1.5(a): digital goods consumed in-app must use store billing,
not Stripe. (Physical marketplace items use Stripe — see
[`stripe-connect.md`](./stripe-connect.md).)

Project ref: `lksjbehxpfndviesnlgm` · Edge base URL:
`https://lksjbehxpfndviesnlgm.supabase.co/functions/v1`

## 0. What's already built (server foundation — no action needed)

| Piece | Slug / table | Notes |
| --- | --- | --- |
| Entitlement store | `app_entitlements` | current state per (user, entitlement_key); own-row read RLS; service-role writes only |
| Transaction audit | `app_store_transactions` | unique `(platform, transaction_id)`; append-only |
| Webhook handler | `revenuecat-webhook` | records the txn + upserts entitlement; `event_ts` stale-guard |

**Currently inert** — the webhook returns `503 revenuecat_unconfigured` until
`REVENUECAT_WEBHOOK_AUTH` is set (step 4).

## 1. Prerequisites (all external — this is the blocking work)

- A **RevenueCat** account + project.
- **App Store Connect** (iOS) and **Google Play Console** (Android) products.
- A **native build** — `react-native-purchases` is a native module and does
  **not** run in Expo Go; you need an EAS dev/prod build to test purchases.

## 2. Entitlement keys (the contract — must match the app exactly)

Configure these entitlement identifiers in RevenueCat. The app gates features on
them and the webhook upserts `app_entitlements.entitlement_key` verbatim:

| Key | Unlocks |
| --- | --- |
| `plus` | MyStreet+ (wider map radius, AI description helper, priority) |
| `custom_radius` | custom search-radius perk |
| `boost` | listing boosts/promotions |

## 3. Store products → RevenueCat

1. Create the products/subscriptions in **App Store Connect** and **Play
   Console** (e.g. a `mystreet_plus_monthly` auto-renewable sub at the desired
   price).
2. In RevenueCat, add them under **Products**, attach them to **Offerings**, and
   map them to the **entitlements** above.

## 4. Wire the webhook (arms the server)

RevenueCat Dashboard → **Integrations → Webhooks**:

- **URL:** `https://lksjbehxpfndviesnlgm.supabase.co/functions/v1/revenuecat-webhook`
- **Authorization header:** choose a strong secret string. Set the SAME value as
  the `REVENUECAT_WEBHOOK_AUTH` Edge secret (Dashboard → Edge Functions → Secrets,
  or `supabase secrets set REVENUECAT_WEBHOOK_AUTH=… --project-ref
  lksjbehxpfndviesnlgm`). The webhook accepts it with or without a `Bearer `
  prefix; a mismatch → `401`.

The handler maps event types to entitlement state:

| Event | Effect on `app_entitlements` |
| --- | --- |
| `INITIAL_PURCHASE`, `RENEWAL`, `UNCANCELLATION`, `PRODUCT_CHANGE`, `NON_RENEWING_PURCHASE` | active |
| `CANCELLATION`, `BILLING_ISSUE` | stays active, `will_renew=false` |
| `EXPIRATION`, `REFUND`, `SUBSCRIPTION_PAUSED` | revoked (`is_active=false`) |
| `TRANSFER`, `SUBSCRIBER_ALIAS` | acknowledged, no entitlement change |

Out-of-order deliveries are handled: each write carries the event's
`event_timestamp_ms`, and a DB trigger drops any update older than the stored
one.

## 5. Client mobile API keys

RevenueCat → **API keys** → copy the **public** SDK keys into the mobile app's
env (public keys are safe in the client):

```
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_…
```

## 6. Critical: identify the user to RevenueCat

The webhook attributes entitlements by `app_user_id`, which **must equal the
Supabase auth uid**. After login, call `Purchases.logIn(session.user.id)` (and
`Purchases.logOut()` on sign-out). Without this, entitlements land on an
anonymous RevenueCat id and never reach the right `app_entitlements` row.

## 7. Remaining client wiring (still TODO — blocked on 1–6)

This is the mobile fast-follow once the account + keys + a native build exist
(deferred deliberately — installing the native module would break the Expo Go
smoke and can't be verified without the above):

1. `pnpm expo install react-native-purchases` (+ config plugin).
2. Configure the SDK at boot with the platform key; `Purchases.logIn(uid)`.
3. Add `entitlementsApi.mine()` in `src/shared/lib/api.ts` reading
   `app_entitlements` (own-row) — the **server-validated** source of truth.
4. Rewire `app/subscription.tsx` + `features/subscription` to RevenueCat
   (purchase + restore), gating `plus` / `custom_radius` / `boost` on the server
   entitlement, with the RevenueCat `CustomerInfo` as the instant-UI cache.
   Tracked as mobile **TASK-015**.

## 8. Verify (sandbox)

1. Set `REVENUECAT_WEBHOOK_AUTH`; confirm `revenuecat-webhook` stops returning
   `503`.
2. Sandbox-purchase MyStreet+ on a device → RevenueCat fires
   `INITIAL_PURCHASE` → check an `app_entitlements` row (`plus`, `is_active=true`)
   for your uid and a row in `app_store_transactions`.
3. Restore on a fresh install → entitlement re-appears.
4. Issue a sandbox refund → `REFUND` event → entitlement `is_active=false`.

Sandbox renewal timings are accelerated (1 month ≈ 5 min).
