# MyStreet Web Agent Board — DB OWNER

Project: MyStreet Web (admin + marketing)
Current focus: Own the shared Supabase backend (schema, RLS, Edge Functions) and wire the admin dashboard; coordinate all DB changes with fethi-mobile via SCRs
Current milestone: 10-day production launch — shared backend + admin surface, two parallel build lanes
Updated: 2026-07-22 (codebase re-audit — WEB-018…020 filed)

## ⚠️ Database coordination (READ FIRST)

`fethi-web` is the **canonical owner of the shared Supabase database** that
`fethi-mobile` also uses. **Every** change to schema / RLS / enums / Edge
Functions goes through a **Schema Change Request (SCR)** in
`docs/db/decisions/`, regenerates `src/lib/database.types.ts`, and updates
`docs/MOBILE-SYNC-NOTES.md` — in the same PR. Full protocol:
**`docs/db/COORDINATION.md`**. The dependency map (§6) lists which mobile tasks
each backend task unblocks. Do not change the DB without an SCR.

## Columns

- Backlog
- Ready
- In Progress
- Review
- Blocked
- Done

## Two-developer lanes

- **Dev A** — Shared backend authority: schema, RLS, Edge Functions, seed, generated types. **These tasks unblock the mobile board** (see the cross-repo map).
- **Dev B** — Admin app: auth/RBAC + dashboard screens that consume the schema.
- **Either** — Cross-cutting / marketing tasks.

Each dev pulls their lane: `npm run board:next:a` (Dev A) / `npm run board:next:b` (Dev B).

## Current Tasks

| Task | Title | Status | Owner | Priority |
| --- | --- | --- | --- | --- |
| WEB-001 | Shared DB contract + coordination protocol (supabase home, types, SCR, CI guard) | Done | Dev A | P0 |
| WEB-002 | Admin app architecture: data-access seam, env, supabase client | Done | Dev B | P0 |
| WEB-003 | Core schema + RLS: profiles, listings, categories, favorites, saved_searches | Done | Dev A | P0 |
| WEB-004 | Admin auth + staff RBAC + route protection | Done | Dev B | P0 |
| WEB-005 | Messaging/offers/orders schema + RLS + transition Edge Functions | Done | Dev A | P1 |
| WEB-006 | Stripe Connect Express + payment/webhook Edge Functions (shared) | Done | Dev A | P0 |
| WEB-007 | Notifications schema + push-dispatch Edge Function (shared) | Review | Dev A | P1 |
| WEB-008 | Reviews/reports schema + account deletion/export + KYC-status Edge Functions | Done | Dev A | P1 |
| WEB-009 | User management (list/search/suspend/ban) wired to Supabase | Done | Dev B | P1 |
| WEB-010 | Listing management + moderation queue | Done | Dev B | P1 |
| WEB-011 | Reports / moderation review workflow | Done | Dev B | P1 |
| WEB-012 | KYC verification dashboard (Stripe Connect status) | Done | Dev B | P1 |
| WEB-013 | Orders, disputes, finance, refunds | Done | Dev B | P1 |
| WEB-014 | Analytics & reporting read models | Done | Dev B | P2 |
| WEB-015 | Marketing site + waitlist/referral | Done | Either | P2 |
| WEB-016 | Server-authoritative order pricing | Done | Dev A | P0 |
| WEB-017 | Payment↔order reconciliation, Connect payouts & escrow capture | Review | Dev A | P1 |
| WEB-018 | Ratify the calling decision (schema for `calls`, or record the cut) | Done | Dev A | P2 |
| WEB-019 | SCR: `search_listings_nearby` RPC (use the PostGIS index we built) | Ready | Dev A | P2 |
| WEB-020 | Finish the admin surfaces still rendering static markup | Ready | Dev B | P3 |
| WEB-021 | Connect Express dashboard login-link Edge Function (unblocks mobile payouts dashboard) | Ready | Dev A | P2 |

## Re-audit 2026-07-22 — backend gaps found

A pass over both codebases against these boards surfaced three items this repo owns:

- **The PostGIS index is dead.** SCR-001 created `listings.location` (generated
  `geography`) and `listings_location_gix`, per ADR-0001. `st_dwithin` appears in
  **no** migration and no query in either repo. Mobile therefore approximates
  radius search with a bbox and filters to the exact radius in JS *after*
  pagination — wrong counts, broken paging, per-page-only distance ordering. → **WEB-019**
- **Calling was never scoped.** Mobile ships a full calling surface against the
  retired HTTP backend; there is no `calls` table and no SCR proposing one. As
  schema owner this repo has to cut it or spec it. → **WEB-018**
- **Admin shells.** Only 3 of 90 pages still import fixtures, but the dashboard's
  GMV chart and activity feed are fabricated, and feature-flags / webhooks /
  api-keys / announcements / templates are static shells whose controls discard
  their input. → **WEB-020**

Consumer-side findings (mobile TASK-016…022) are on the mobile board. Two of them
sit behind mobile tasks already marked Done — worth noting because the same could
be true here: **WEB-008's `account-delete` / `account-export` functions are
deployed but the mobile app never invokes them**, so the store-compliance
capability this repo shipped has no caller.

## Recommended Start

Day 1, in parallel:

- **Dev A → WEB-001** (stand up `supabase/`, the SCR workflow, `npm run db:types`, the CI drift guard). This is the coordination root — it unblocks every backend task here AND the mobile board's consumer setup.
- **Dev B → WEB-002** (admin data-access seam + supabase client + env). Or pull **WEB-015** (marketing) which only needs WEB-002.

## Critical path (keeps both lanes busy)

```
Dev A (backend, unblocks mobile):
  001 ─▶ 003 ─▶ 005 ─▶ 006
           └▶ 007        └▶ 008
Dev B (admin UI):
  002 ─▶ 004 ─▶ 009 / 010 / 014
                 011 (needs 008)
                 012 / 013 (need 006)
Either: 015
```

## Cross-repo unblocks (this board → mobile board)

| This task | Produces | Unblocks in fethi-mobile |
| --- | --- | --- |
| WEB-003 | profiles/listings/categories/favorites/saved_searches + RLS | TASK-004, TASK-005, TASK-006, TASK-008 |
| WEB-005 | threads/messages/offers/orders + transition Edge Functions | TASK-007, TASK-010 |
| WEB-006 | Stripe PaymentIntent + Connect + webhook Edge Functions | TASK-011 |
| WEB-007 | notifications + push-dispatch Edge Function | TASK-009 |
| WEB-008 | reviews/reports + account deletion/export + KYC-status | TASK-013, TASK-014 |

Land these **early in the day** so the mobile lane can sync types and unblock.

## Working Rules

- **No schema/RLS/enum/Edge Function change without a merged SCR** (`docs/db/COORDINATION.md`).
- Schema/RLS/Edge Functions are authored **only here** — mobile never writes a migration.
- Wire admin behavior behind `src/lib/api.ts` (the existing seam); swap implementations, keep interfaces.
- Migrations are additive + forward-only; never edit a merged migration; never drop a column the other app still reads.
- Only `NEXT_PUBLIC_*` values in client code; service-role keys live in Edge Functions / server route handlers only.
- Stripe handles marketplace money + seller KYC/payouts (Connect Express). Digital entitlements are mobile-side (RevenueCat) — not this repo.
- Update `docs/MOBILE-SYNC-NOTES.md` + regenerate types in the same PR as any shared change.
