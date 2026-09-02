# MyStreet Web (Admin) — QA Manual

Manual verification checklist for **shipped** admin/backend tasks. Run through the
relevant section after any change that could touch it (regression pass), or to
sign off a task. Each item says **what to do** and **what you should see**.

> Legend: ✅ = automated coverage exists (named below) · 🖐 = manual-only ·
> ⚠️ = known gap / not wired yet.

## Setup

- **Run the app:** `npm run dev` → http://localhost:3000
- **Staff admin login:** `admin@mystreet.com` / `Mystreet123` (has `staff_members.roles = ['admin']`).
- **Env:** `.env.local` (gitignored) must hold `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Never paste secrets into the UI/issues.
- **Automated suite:** `npm run typecheck` and `npm run test:e2e` (Playwright;
  WEB-009/010 specs run live against Supabase using `.env.local`).

---

## WEB-001 — Shared DB contract + coordination (infra)
Mostly dev-facing; verify the guardrails still hold.
- 🖐 `npm run db:types` runs clean and regenerates `src/lib/database.types.ts` with a schema-version hash header.
- 🖐 `supabase/applied-scrs.json` lists `SCR-000…004`; SCR design docs exist under `docs/db/decisions/`.
- 🖐 `npm run typecheck` passes. **Pass:** no drift, types compile.

## WEB-002 — Admin app architecture (data seam, env, Supabase client)
- 🖐 App boots at `/` with no console errors. **Pass:** marketing/login renders.
- 🖐 Missing env fails loudly (temporarily blank a key in `.env.local`, restart) → clear startup error, **not** a silent half-broken page. Restore the key after.
- 🖐 ✅ No service-role key in the client bundle: `grep -r SUPABASE_SECRET_KEY .next/static` returns nothing. **Pass:** secret stays server-side.

## WEB-003 — Core schema + RLS (profiles, listings, categories, favorites, saved_searches)
- 🖐 Anonymous read is scoped: a signed-out client can read **only `ACTIVE`** listings + `public_profiles`, never another user's private profile fields (lat/lng/email).
- 🖐 Storage buckets `listing-photos` and `avatars` exist and are public-read.
- ✅ Covered transitively by the mobile contract tests (TASK-005/006/008) which exercise the same RLS. **Pass:** cross-owner reads/writes are denied.

## WEB-004 — Admin auth + staff RBAC + route protection
- ✅🖐 **Login:** go to `/login`, enter `admin@mystreet.com` / `Mystreet123`, submit → lands on `/dashboard`.
- 🖐 **Bad password** → inline error "E-mail ou mot de passe incorrect.", stays on `/login`.
- ✅ **Route guard:** while signed out, visiting `/dashboard`, `/users`, or `/listings` **redirects to `/login`** (never renders the dashboard, never 500s).
- 🖐 **Non-staff:** sign in as a user with **no `staff_members` row** → must be denied the admin area (redirect/forbidden), never authorized off `user_metadata`.
- 🖐 **Logout** clears the session; protected routes redirect again.
- *Auto:* `e2e/admin.smoke.spec.ts` + the WEB-009/010 sign-in flows.

## WEB-005 — Messaging / offers / orders schema + transition Edge Functions
- 🖐 Tables exist with participant-scoped RLS: `threads`, `messages`, `message_attachments`, `offers`, `orders`, `order_events`, `idempotency_keys`.
- 🖐 Enums match the mobile contract: `offer_status` (PENDING/ACCEPTED/REJECTED/EXPIRED/WITHDRAWN), `order_status`, `message_kind`.
- ⚠️ Transition Edge Functions (`offers-respond`, `orders-create`, `orders-transition`) are **authored but deploy-pending** (Docker unavailable locally). **Pass for now:** schema + RLS present; mark function behavior `manual` until deployed.

## WEB-009 — User management (list / search / suspend / ban / reactivate)
Sign in as admin, go to **`/users`**.
- 🖐 The list renders **live** users from Supabase (not mock data), with name, neighbourhood, status, KYC.
- 🖐 **Search/filter** by name and by status returns the expected subset.
- 🖐 Open a user → **Suspend** → the status pill flips to SUSPENDED **and** it persists after refresh (DB write), **and** an audit row was recorded.
- 🖐 **Ban** then **Reactivate** round-trips the same way.
- ✅ **Security:** the mutation endpoint rejects unauthenticated/non-staff callers (401/403, not 404). 
- *Auto:* `e2e/tasks/WEB-009.spec.ts` — seeds a throwaway user, signs in as admin, suspends, asserts DB + audit row, and that a non-staff API call is rejected.

## WEB-010 — Listing management + moderation queue
Sign in as admin, go to **`/listings`**.
- 🖐 Lists **live** listings; filter by status/type/owner works.
- 🖐 Open a listing → **Pause** → status flips to PAUSED + persists; **Archive** → ARCHIVED; **Restore** → ACTIVE. Each action records an audit row capturing the prior status.
- 🖐 **`/listings/moderation`** surfaces listings needing attention (PENDING_REVIEW / DRAFT / PAUSED / ARCHIVED); approving/rejecting/restoring/pausing inline round-trips. See WEB-023 below for the PENDING_REVIEW approval flow specifically.
- ✅ **Security:** the moderation/status endpoints are staff-gated (unauth → 401/403).
- *Auto:* `e2e/tasks/WEB-010.spec.ts` — staff sees a live listing, soft-hide + restore round-trip, and the moderation route is staff-gated.

## WEB-020 — Finish the admin surfaces still rendering static markup

Sign in as admin.
- 🖐 **`/dashboard`:** the GMV/signups trend chart reflects real `analyticsApi.marketplace()`/
  `signupsTrend()` data (not a static fixture) — compare against a known order/signup in
  the DB for the same date range.
- 🖐 **`/dashboard` activity feed:** still sample data (no backend read model exists yet)
  — must show a visible "Exemple" label so it's not mistaken for live activity. ⚠️ Not
  wired to real events; a follow-up task is needed if a real activity stream is wanted.
- 🖐 **`/users/[id]`:** header shows the real admin user record (status/KYC in real
  UPPERCASE enum values), not a fabricated phone number or fabricated
  transactions/reports counts.
- 🖐 **`/settings/feature-flags`, `/settings/api-keys`, `/settings/webhooks`,
  `/communications/announcements`, `/communications/templates`:** each shows a visible
  "not connected to a backend" notice and every control (toggle/button/form) is
  **disabled** — clicking anything provably does nothing, rather than silently
  discarding input.
- ✅ **Security:** dashboard analytics route handlers reject unauthenticated requests.
- *Auto:* `e2e/tasks/WEB-020-dashboard.spec.ts`, `e2e/tasks/WEB-020-shells.spec.ts`.
  ⚠️ One dashboard test (`GMV trend reflects the live marketplace analytics endpoint`)
  is `manual`-only in this sandbox — service-role Supabase client construction fails
  under this environment's Node/WebSocket setup (same pre-existing gap as
  `e2e/tasks/WEB-014.spec.ts`); verify this one by hand until that's fixed.

## WEB-022 — Support inbox (`support_tickets`, SCR-028) — issue #77

Sign in as admin, go to **`/communications/support`**.
- ✅ **Inbox list:** open/in-progress tickets, filter tabs by status, requester
  name, subject, last-message preview, unread badge when `unreadByStaff > 0`.
  Empty state (no fabricated data) when a filter has zero tickets.
- ✅ **Ticket detail:** open a ticket → thread renders oldest→newest, USER vs
  STAFF messages visually distinct. Reply → message lands, ticket's last
  message/status update live on the page after refetch.
- ✅ **Status control:** change status (Open/In progress/Resolved/Closed);
  idempotent re-apply is a no-op.
- ✅ **Reopen on user reply:** if a user replies (from the mobile app, via
  fethi-mobile TASK-029) to a `RESOLVED`/`CLOSED` ticket, it flips back to
  `OPEN` (DB trigger, not app logic) — verify by replying as the seeded e2e
  user against a resolved ticket and checking `status` in the DB.
- ✅ **Security:** `/api/admin/support/[id]/status` rejects unauthenticated
  requests; RLS denies a non-staff user reading or inserting into another
  user's ticket/messages.
- ⚠️ No realtime subscription on this admin screen (deliberately cut from
  scope — refresh/reopen the page to see new messages/tickets). Mobile does
  subscribe live; both tables carry `supabase_realtime`.
- *Auto:* `e2e/tasks/WEB-022.spec.ts` (staff reply + status round-trip, staff
  gate, RLS contract check — 3/3 passing).

---

## WEB-023 — Pre-publish listing moderation gate (`PENDING_REVIEW`, SCR-029) — issue #68

A listing inserted with `status: PENDING_REVIEW` is invisible to the public (same RLS as DRAFT) until staff approves it.
- ✅ **Invisible while pending:** a `PENDING_REVIEW` listing does not appear on the public marketplace or in `GET /rest/v1/listings` for `anon`; its owner can still see it (own-row RLS).
- 🖐 **`/listings/pending`:** sign in as admin, go to `/listings/pending` — table of PENDING_REVIEW listings (title, category, price, submitted date). **Approuver** → status flips to ACTIVE, listing disappears from this queue, becomes publicly visible. **Rejeter** → status flips to ARCHIVED.
- 🖐 **`/listings/moderation`:** filter to "En attente de validation" shows the same set with Approuver/Rejeter row actions; other statuses keep their existing Masquer/Restaurer/Retirer actions.
- 🖐 **Listing detail (`/listings/[id]`):** a PENDING_REVIEW listing shows Approuver/Rejeter instead of the usual Pause/Archive actions.
- 🖐 **Sidebar badge:** the "Annonces" nav group and its "En attente" child show a live count of PENDING_REVIEW listings (polls every 60s); disappears when the count is 0.
- ✅ **Audit:** approve records `listing.approve`, reject records `listing.reject` (SCR-004 audit log), both under `target_type: listing`.
- ✅ **DB-level guard (not just the admin UI):** an owner cannot self-approve their own PENDING_REVIEW/DRAFT listing to ACTIVE via a direct client-side `UPDATE` (`guard_listing_status_transition` trigger) — only the staff service-role path can. Editing an already-ACTIVE listing, and owner pause/unpause, are unaffected (not gated).
- ⚠️ **Dormant until fethi-mobile ships its follow-up:** `sell/review.tsx` still defaults new listings to `ACTIVE` today (unchanged in this PR) — no listing will actually reach `PENDING_REVIEW` in production until that mobile PR lands. Everything above is fully live/testable now by seeding a `PENDING_REVIEW` row directly (as the e2e does), just not yet reachable by a real seller flow.
- *Auto:* `e2e/tasks/WEB-023.spec.ts` — RLS visibility (anon denied, owner allowed), the self-approval DB guard, staff approve round-trip (+ public visibility after), staff reject round-trip, and the status route handler's staff gate (5/5 passing).

---

## Not yet shippable to QA (don't test as "done")
- ⚠️ **Stripe / payments / payouts / finance / refunds / KYC dashboards** — UI shells only; backend is **WEB-006/012/013** (Backlog). The `/finance`, `/refunds`, `/disputes`, `/kyc`, `/orders`, `/analytics` routes are **not wired** yet.
- ⚠️ **Reports / moderation review workflow** — WEB-011 (needs WEB-008's `reports` table). The moderation queue today is state-driven (DRAFT/PAUSED/ARCHIVED), `reportsCount` is always 0.
