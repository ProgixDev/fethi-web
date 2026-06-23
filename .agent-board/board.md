# MyStreet Web Agent Board — DB OWNER

Project: MyStreet Web (admin + marketing)
Current focus: Own the shared Supabase backend (schema, RLS, Edge Functions) and wire the admin dashboard; coordinate all DB changes with fethi-mobile via SCRs
Current milestone: 10-day production launch — shared backend + admin surface, two parallel build lanes
Updated: 2026-06-23

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
| WEB-005 | Messaging/offers/orders schema + RLS + transition Edge Functions | Review | Dev A | P1 |
| WEB-006 | Stripe Connect Express + payment/webhook Edge Functions (shared) | Backlog | Dev A | P0 |
| WEB-007 | Notifications schema + push-dispatch Edge Function (shared) | Backlog | Dev A | P1 |
| WEB-008 | Reviews/reports schema + account deletion/export + KYC-status Edge Functions | Backlog | Dev A | P1 |
| WEB-009 | User management (list/search/suspend/ban) wired to Supabase | Backlog | Dev B | P1 |
| WEB-010 | Listing management + moderation queue | Backlog | Dev B | P1 |
| WEB-011 | Reports / moderation review workflow | Backlog | Dev B | P1 |
| WEB-012 | KYC verification dashboard (Stripe Connect status) | Backlog | Dev B | P1 |
| WEB-013 | Orders, disputes, finance, refunds | Backlog | Dev B | P1 |
| WEB-014 | Analytics & reporting read models | Backlog | Dev B | P2 |
| WEB-015 | Marketing site + waitlist/referral | Ready | Either | P2 |

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
