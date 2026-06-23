# Mobile Sync Notes (web → mobile)

Append-only changelog of shared-database changes that **`fethi-mobile` must react
to**. Update this file in the **same PR** as any shared schema / RLS / enum /
Edge Function change. See `docs/db/COORDINATION.md`.

Each entry: date · SCR · what changed · what mobile must do.

---

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
