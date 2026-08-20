# Mobile Sync Notes (web → mobile)

Append-only changelog of shared-database changes that **`fethi-mobile` must react
to**. Update this file in the **same PR** as any shared schema / RLS / enum /
Edge Function change. See `docs/db/COORDINATION.md`.

Each entry: date · SCR · what changed · what mobile must do.

---

## 2026-08-20 · SCR-017 · New table `waitlist` — no mobile action

- **What:** New table `public.waitlist` (`id`, `email`, `referral_code`,
  `source`, `created_at`), unique index on `lower(email)`, RLS enabled with
  **no policies** (service-role-write-only, matches the `categories` "writes
  service-role only" precedent). Backs `POST /api/marketing/waitlist` on the
  web marketing site, which previously validated and threw every signup away
  (in-process dedupe only, reset on every redeploy).
- **Mobile must:** nothing. This is a web-only, pre-launch marketing-site
  table — no mobile screen or flow reads or writes it, and none is planned.
  Not vendored into `fethi-mobile/src/shared/types/database.types.ts` for
  that reason (see `docs/db/decisions/SCR-017.md` "Affected consumers").
  Noted here purely so a mobile dev scanning this changelog isn't surprised
  by a new table appearing in a future `fethi-web` types diff.

## 2026-08-19 · SCR-016 · `listings.meeting_venue` (persist the public handoff venue) — unblocks mobile `fix/issue-23-public-venue` / issue #23

- **What:** New column `listings.meeting_venue text` (nullable, no default,
  no index, no new RLS policy). Holds the seller-entered public meetup spot
  (e.g. `"Café X, République"`) for a public handoff — the mobile sell flow
  already requires and gates this on `pickupMethod === 'meeting'` client-side
  before ever sending `meetingVenue`, so a non-null `meeting_venue` is already
  implicitly "this was a public handoff." `pickup_method`/`availability`
  themselves are **not** added — `CreateListingRequest` doesn't even send them
  today, and adding them would be a materially bigger, unrequested contract
  change; see the "Scope decision" section of SCR-016.md for the full
  reasoning. `applied-scrs.json` appends **SCR-016** (provisional — see
  status note below).
  **Status: Proposed — pending DB reviewer sign-off** (see
  `docs/db/decisions/SCR-016.md`); do not treat this as `Accepted` until a
  human flips it.
- **RLS:** unchanged. `listings` RLS is row-level (SCR-001's
  `listings_select_active`/`listings_select_own`/`listings_insert_own`/
  `listings_update_own`/`listings_delete_own`), so it automatically covers
  the new column — owners can read/write their own row's `meeting_venue`
  (any status), and non-owners/`anon` can read it only once the listing is
  `ACTIVE` (intended: a buyer needs to see where to meet).
- **Verified locally** (`supabase start` + `db reset` to force a fresh apply
  of every migration through this one, real `psql` against the local
  Postgres): insert with `meeting_venue` set round-trips exactly; insert
  without it defaults to `NULL`; update can set/clear it. RLS: `anon` and a
  non-owner `authenticated` user both get 0 rows selecting a `DRAFT` listing
  with `meeting_venue` set; a non-owner's `UPDATE` on the owner's row affects
  0 rows; the owner's own `UPDATE` succeeds; `anon` reading an `ACTIVE`
  listing sees `meeting_venue` (intended — public listings' venue is meant to
  be publicly visible). Types regenerated via the canonical `npm run
  db:types` (schema-version `019a7fd600c6`). Full evidence table in
  SCR-016.md.
- **Mobile must:** once this SCR is `Accepted` and merged, `listingReqToColumns`
  in `src/shared/lib/api.ts` maps `meetingVenue` → `meeting_venue` (already
  wired in the mobile branch, gated behind this SCR shipping for real).

## 2026-08-19 · SCR-015 · Listing publication confirmation (exactly-once notification) — unblocks mobile PR #40 / issue #21

- **What:** New column `listings.publication_request_id uuid` (nullable) +
  unique index `listings_owner_publication_request_id_key` on `(owner_id,
  publication_request_id) WHERE publication_request_id IS NOT NULL` — lets a
  client retry a lost publish response and recover the original listing
  instead of creating a duplicate. New unique index
  `listing_photos_listing_storage_path_key` on `listing_photos (listing_id,
  storage_path)` — makes a photo-sync upsert with `onConflict:
  'listing_id,storage_path'` idempotent across a retry. New table
  `listing_publication_notifications` (ledger, `listing_id` PK, RLS enabled
  with **zero policies** — default-deny to every client role, including the
  listing's own owner; it's a server-side dedup key, not an API resource).
  New `AFTER INSERT OR UPDATE OF status ON listings` trigger
  `notify_listing_published()` (`security definer`, `search_path=''`) that
  inserts exactly one `notifications` row (kind `SYSTEM`) the first time a
  listing becomes `ACTIVE` — never again on a later `ACTIVE` update, and never
  on an unrelated column change. `applied-scrs.json` appends **SCR-015**.
  **Status: Proposed — pending DB reviewer sign-off** (see
  `docs/db/decisions/SCR-015.md`); do not treat this as `Accepted` until a
  human flips it.
- **Verified locally** (`supabase start`, all migrations through this one
  applied, real `psql` against the local Postgres): direct `ACTIVE` insert →
  1 ledger row + 1 notification; unrelated-column update → unchanged; no-op
  `ACTIVE→ACTIVE` update → unchanged; `DRAFT→ACTIVE` transition → 1 new
  ledger row + 1 new notification for that listing. RLS: `anon`, a
  non-owner `authenticated` user, and even the listing's own owner are all
  denied `SELECT`/`INSERT` on the ledger table (`42501` RLS policy
  violation) — only the `SECURITY DEFINER` trigger function can write it.
  Full evidence table in SCR-015.md.
- **Mobile must:** the vendored `src/shared/types/database.types.ts` +
  `applied-scrs.json` are updated (SCR-015 applied) in this same PR. Pass a
  stable client-generated `publicationRequestId` (UUID) on
  `listingsApi.create`/the publish request so a retry after a lost response
  looks up the existing listing by `(owner_id, publication_request_id)`
  instead of creating a duplicate (and a duplicate notification — the ledger
  makes the notification side effect exactly-once server-side regardless,
  but avoiding a duplicate *listing* is still on the client). Photo sync
  should `upsert` (not plain `insert`) with `onConflict:
  'listing_id,storage_path'` so a replayed photo-sync call doesn't error or
  duplicate. The publish confirmation screen can rely on exactly one
  `SYSTEM`-kind notification with `href: /listing/<id>` landing in the
  owner's `notifications` feed the moment the listing goes `ACTIVE` — no
  client-side polling or dedup needed on the notification itself.

## 2026-07-27 · WEB-021 · `connect-dashboard-link` Edge Function — unblocks TASK-019 dashboard piece

- **What:** New Edge Function **`connect-dashboard-link`** (POST-only, **user-JWT**
  authenticated, `verify_jwt` on). Looks up the caller's
  `payout_accounts.stripe_account_id`, refreshes the account from Stripe (syncing
  `onboarding_status` / `payouts_enabled` / `details_submitted`, same as
  `connect-onboarding`), then calls `stripe.accounts.createLoginLink` and returns
  `{ url }` — a single-use link into the seller's own **Stripe Express dashboard**
  (balance + payouts + history + bank + schedule). No schema/RLS/enum change → **no
  SCR** (Edge-only). Manifest `edge-functions.json` appends the slug. Deployed live
  (v1, ACTIVE). Error convention matches the other Connect functions (`{ error: code }`):
  - `503 stripe_unconfigured` — Stripe secret not set.
  - `409 no_connect_account` — caller never onboarded (map to "start onboarding").
  - `409 onboarding_incomplete` — account exists but `details_submitted` is false
    (login links require a completed Express account).
- **Why:** Stripe owns all seller money data under Connect Express; the app must not
  replicate balance/payouts/bank. TASK-019 removed the fabricated figures and left the
  "Gérer sur Stripe" CTA on the onboarding account-link (which can't show
  balance/history). This function is the standard way to surface the real dashboard
  without any regulated data touching our DB.
- **Mobile must:** add `connectApi.dashboardLink()` →
  `invokeEdge('connect-dashboard-link', {})` returning `{ url }`; point the payouts
  "Gérer mes versements sur Stripe" CTA at it, falling back to
  `connectApi.startOnboarding()` when the function returns `no_connect_account` /
  `onboarding_incomplete` (seller hasn't finished onboarding yet). Done in **TASK-019**
  follow-up. No coordinate/money data is stored or proxied — the app only opens `url`.

## 2026-07-26 · SCR-014 · `search_listings_nearby` proximity RPC — unblocks TASK-022

- **What:** Added `public.search_listings_nearby(p_lat, p_lng, p_radius_m, …filters)`
  (`security invoker`, `returns setof listings`) doing `st_dwithin` + distance ordering
  (`<->`) + all scalar filters server-side against the GiST index `listings_location_gix`
  (unused since SCR-001). No table/RLS/enum change. Types regenerated
  (schema-version `ac52c126889f`) and vendored.
- **Mobile must:** route the radius case of `queryListings` through
  `supabase.rpc('search_listings_nearby', {…}, { count: 'exact' }).select(LISTING_SELECT).range()`
  instead of the bbox-prefilter-then-client-cut (done in **TASK-022**). Pass filters as
  `p_*` params; the function returns `setof listings` so `LISTING_SELECT` embeds still work,
  and the distance order is preserved through pagination (add no client `.order()`/filters).
  Delete the old `bboxDelta` + client-side radius filter. Exact `count` is now correct.

## 2026-07-07 · SCR-010 · Notifications + Expo push dispatch — unblocks TASK-009

- **What:** New enum `notif_kind` (`MESSAGE`/`OFFER`/`BOOKING_REQUEST`/`LISTING_SOLD`/
  `ORDER_UPDATE`/`REVIEW`/`PAYOUT`/`SYSTEM`) — values are **byte-identical** to the
  shipped mobile `api.ts` `NotifKind` union. New tables:
  - **`notifications`** — own-row RLS (a user reads ONLY their own). Columns:
    `id`, `user_id`, `kind`, `title`, `body` (nullable), `href` (nullable),
    `read_at timestamptz` (null = unread), `unread boolean` (generated:
    `read_at is null`), `created_at`. The generated `unread` column maps 1:1 to
    `ApiNotification.unread`. **Added to the `supabase_realtime` publication** for
    the live in-app feed (RLS still applies, so you only receive your own rows).
  - **`device_push_tokens`** — `unique(user_id, token)`; columns `token`,
    `platform` (`ios`/`android`/`web`), `last_used_at`, timestamps. A user fully
    manages ONLY their own rows (select/insert/update/delete under RLS).
  One Edge Function authored: **`notifications-dispatch`** (POST-only,
  **service-role-authenticated** — server-to-server, NOT called with a user JWT).
  It stores one in-app `notifications` row per recipient (always), then fans out
  Expo push to each recipient's tokens (chunked at 100) and prunes tokens returned
  as `DeviceNotRegistered`. Uses a server-only `EXPO_ACCESS_TOKEN` Edge secret;
  returns 503 when unconfigured. `applied-scrs.json` appends **SCR-010**.
- **Mobile must:** once the vendored `database.types.ts` + `applied-scrs.json` are
  refreshed by the web parent (SCR-010 applied), **TASK-009** unblocks. (1) Read
  `notifications` directly under RLS and subscribe to Realtime narrowed by
  `user_id = auth.uid()` for the live feed; render `ApiNotification` straight from
  the row (`unread` is a real column). (2) Mark-read = `update notifications set
  read_at = now()` on your own rows (own-row UPDATE policy). (3) Register the Expo
  push token by **upserting** into `device_push_tokens` on conflict `(user_id,
  token)`; delete the row on logout. (4) Do **NOT** call `notifications-dispatch`
  from the app — it is server-only (service-role bearer); the backend fires push on
  domain events. (5) Push may be denied on device — that's fine, the in-app row is
  still stored, so the feed never drops a notification.

---

## 2026-07-06 · WEB-013 · Admin orders/finance/refunds (no schema change)

- **What:** Wired the admin orders/disputes/finance/refunds surface to live
  Supabase data via new same-origin routes (`/api/admin/orders`,
  `/api/admin/orders/[id]`, `/api/admin/finance/summary`) backed by a new
  `OrdersRepository` on the service-role client. Added an idempotent Stripe
  refund action (finance role only; `Idempotency-Key: refund_<orderId>`). **No
  new tables or columns** — reads the existing `orders` rows + SCR-009 payment
  columns; the Stripe webhook remains the source of truth for the REFUNDED flip.
- **Mobile must:** nothing. Admin-only change, no shared schema/type impact.

---

## 2026-07-06 · SCR-009 · Stripe Payments + Connect Express

- **What:** New enum `payment_status` (PENDING/SUCCEEDED/FAILED/REFUNDED/DISPUTED/PARTIALLY_REFUNDED).
  New columns on `orders`: `payment_intent_id`, `payment_status`, `paid_at` (all nullable).
  New tables: `payments` (immutable payment records, service-role writes), `payout_accounts`
  (seller Stripe Connect accounts, one per user), `webhook_deduplication` (at-least-once guard).
  Four Edge Functions **deployed** (all ACTIVE on the shared project as of 2026-07-06):
  `payments-config` (POST/GET returns publishable key + configured flag; `verify_jwt=true`),
  `payments-create-intent` (POST creates/reuses PaymentIntent for an order, idempotent),
  `connect-onboarding` (POST generates Connect Express onboarding link),
  `stripe-webhook` (POST verifies signature, dedupes, mutates orders/payments on events;
  **`verify_jwt=false`** — Stripe signature auth, not a user JWT). RLS on all tables;
  clients can read their own payments/payout_accounts via order/user, never write. Webhook is
  the source of truth for payment state. Regenerated `database.types.ts`; `applied-scrs.json`
  appends **SCR-009**; `edge-functions.json` lists all four as deployed.
  Edge secrets set: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
  **Still pending (external Stripe steps):** `STRIPE_WEBHOOK_SECRET` (create the webhook
  endpoint in the Stripe Dashboard first) and `STRIPE_CONNECT_CLIENT_ID` (enable Connect).
  Until those land, `stripe-webhook` returns 503 `stripe_unconfigured` and Connect onboarding
  can't complete — but `payments-config` and PaymentIntent creation work in test mode now.
  Naming note: the client-invoked slug is **`connect-onboarding`** (not `connect-onboard`).
- **Mobile must:** the vendored `src/shared/types/database.types.ts` + `applied-scrs.json`
  are updated (SCR-009 applied) — this unblocks **TASK-011** (payments integration).
  Call `paymentsApi.getConfig()` to get publishable key; `paymentsApi.createIntent(orderId)`
  to create/reuse PaymentIntent; `connectApi.startOnboarding()` to generate Connect link.
  Subscribe to `payments` Realtime for payment status changes; `orders.paymentStatus` updates
  are driven by the webhook. Note: PaymentIntent creation is idempotent per order — a retry
  returns the existing intent.

## 2026-06-30 · SCR-008 · Reviews + account deletion/export + KYC-status

- **What:** New table `reviews` (order-gated public reputation — `order_id`,
  `author_id`, `target_user_id`, `rating 1..5`, `comment`, `created_at`; unique per
  `(author, order, target)`). Public SELECT; INSERT only by the buyer/seller of a
  **COMPLETED** order reviewing the counterparty; immutable from clients. An
  `AFTER` trigger keeps `profiles.rating` (avg) + `profiles.reviews_count` in sync.
  New nullable column `profiles.deleted_at` (account-deletion tombstone). Three new
  Edge Functions (**deployed + ACTIVE** — no Docker): `account-delete`
  (`POST /me/deletion` — 409 `DELETION_BLOCKED` on an active order/dispute, else
  anonymise + ban + tombstone), `account-export` (`POST /me/export` — assembles the
  RGPD archive, returns `QUEUED`), `kyc-status` (`GET /me/kyc-status` —
  Connect→`KycStatus`, falls back to `profiles.kyc_status`).
  `reports` + `blocked_users` were already live (SCR-005/007) — unchanged here.
  Regenerated `database.types.ts`; `applied-scrs.json` appends **SCR-008**.
- **Mobile must:** the vendored `src/shared/types/database.types.ts` +
  `applied-scrs.json` are updated (SCR-008 applied) — this unblocks **TASK-013**
  (reviews/reports) and the backend half of **TASK-014** (account deletion/export,
  KYC). `reviewsApi.create` writes `reviews` (RLS enforces the COMPLETED-order +
  counterparty gate — surface a clean error if rejected); `reviewsApi.listForUser`
  reads them publicly. `meApi.requestDeletion` must relay the `DELETION_BLOCKED`
  code as-is. Edge Functions are authored but **deploy is pending** (Docker/CLI
  unavailable) — until deployed, `/me/deletion` + `/me/export` fail cleanly and the
  UI stays safe.

## 2026-06-23 · SCR-004 · Staff audit log (admin moderation)

- **What:** One new table `staff_audit_log` (id, actor_id, action, target_type,
  target_id, before/after jsonb, reason, created_at) recording every staff write
  action — user suspend/ban/reactivate (WEB-009) and listing pause/archive/restore
  (WEB-010). RLS is **enabled with no anon/authenticated policy**, so the table is
  invisible to the browser; only the service-role admin Route Handlers (gated by
  `requireStaff` + `hasRole`) read/write it. Regenerated `database.types.ts`
  (schema-version 3a3f3151615b). No change to `profiles`/`listings` or any existing
  enum — suspend/ban/pause/archive reuse the existing `user_status` /
  `listing_status` enums.
- **Mobile must:** **nothing.** This is a web-only, service-role-only audit table;
  RLS exposes nothing to mobile. The vendored types + `applied-scrs.json` are
  updated for contract completeness only. Flagged for human ratification in the PR.

## 2026-06-23 · SCR-003 · Messaging / offers / orders transactional core is live

- **What:** Second real schema applied to the shared DB. New tables `threads`,
  `messages`, `message_attachments`, `offers`, `orders`, `order_events`, and an
  `idempotency_keys` ledger; native enums `offer_status`
  (PENDING/ACCEPTED/REJECTED/EXPIRED/WITHDRAWN), `order_status`
  (AWAITING_PICKUP/HANDOFF_PENDING/COMPLETED/CANCELLED/REFUNDED/DISPUTED),
  `message_kind` (TEXT/PHOTO/LOCATION/OFFER/PICKUP/SYSTEM) — all matching the
  shipped `api.ts` tokens exactly. RLS on every table (participant-scoped). Realtime
  enabled on `messages`/`threads`/`offers`/`orders`. Three Deno Edge Functions
  authored (`offers-respond`, `orders-create`, `orders-transition`) — user-JWT auth,
  service-role mutation, `Idempotency-Key` dedup. Regenerated `database.types.ts`
  (schema-version 854df618007b). **Edge Function deploy is pending** (CLI needs Docker).
- **Mobile must:** once the vendored `src/shared/types/database.types.ts` +
  `applied-scrs.json` are refreshed (SCR-003 applied — **the web parent vendors them**,
  not this PR), this unblocks **TASK-007** (messaging: read `threads`/`messages` under
  RLS, subscribe to Realtime narrowed by `thread_id`, `sendPhoto` → `message_attachments`)
  and **TASK-010** (offers/orders). Key contract notes: (1) **never mutate `offers`/`orders`
  status directly** — call the Edge Functions (`offersApi.*`, `ordersApi.create/confirmPickup/
  cancel`); raw clients have no write policy on order/offer status. (2) Open-or-retrieve a
  thread is `unique(listing_id, buyer_id)`. (3) Send an `Idempotency-Key` header on
  create/transition so retries don't duplicate. (4) Offers default to a 48h `expires_at`;
  an accept on an expired offer is rejected. (5) `confirm-pickup` is two-sided (both parties
  confirm → COMPLETED). Edge Functions must be deployed before TASK-010 can run end-to-end.

## 2026-06-23 · SCR-002 · Staff roles (admin RBAC) — no mobile action

- **What:** Added `staff_role` enum + `staff_members` table + `is_staff` /
  `has_staff_role` helpers for the web admin's role-based access. Regenerated
  `database.types.ts` (schema-version 95ac54a374bb).
- **Mobile must:** nothing. Staff roles are web-only; mobile RLS exposes no rows
  of `staff_members`. The vendored types are refreshed only to keep the contract
  byte-identical across repos.

## 2026-06-22 · SCR-001 · Core marketplace schema is live

- **What:** First real schema applied to the shared DB. New tables `profiles`,
  `categories`, `listings`, `listing_photos`, `favorites`, `saved_searches`; the
  `public_profiles` security-definer view; native enums (`listing_type` =
  VENTE/LOCATION/SERVICE, `listing_status`, `user_status`, `kyc_status`,
  `listing_condition`); PostGIS + generated `geography` location columns (ADR-0001);
  RLS on every table; Storage buckets `listing-photos` + `avatars` (public-read,
  owner-scoped write). Regenerated `database.types.ts` (schema-version a68c9530f30c).
- **Mobile must:** the vendored `src/shared/types/database.types.ts` +
  `applied-scrs.json` are updated (SCR-001 applied) — this unblocks **TASK-004**
  (profiles/avatar), **TASK-005** (categories + public listings read), **TASK-006**
  (listing authoring + photos), **TASK-008** (favorites/saved searches). Read tables
  behind the `api.ts` seam. Notes: enum values are the French uppercase tokens
  already in `api.ts`; exact `lat/lng` are private (use `public_profiles` for other
  members); only ACTIVE listings are anon-readable; upload to a path prefixed by
  your own `auth.uid()`.

## 2026-06-21 · SCR-000 · Coordination protocol established

- **What:** `fethi-web` is the canonical owner of the shared Supabase database.
  All schema/RLS/Edge changes go through SCRs in `docs/db/decisions/`. Generated
  types (`src/lib/database.types.ts`) are the contract and are vendored into
  mobile at `src/shared/types/database.types.ts`.
- **Mobile must:** read `fethi-mobile/docs/WEB-BACKEND-SYNC.md`; do not author
  migrations; consume the contract behind `src/lib/api.ts`; file needs as SCRs
  here. No code action yet — types land with WEB-001.

<!-- New entries above this line, newest first. -->
