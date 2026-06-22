# Database & Migration Coordination Protocol (CANONICAL)

This is the **single source of truth** for how `fethi-web` (admin + marketing)
and `fethi-mobile` (consumer app) coordinate on the **one shared Supabase
database** they both use.

> If you are about to change schema, RLS, an enum, or an Edge Function — **stop
> and read this first.** A change here can silently break the other app.

---

## 0. Topology

```
                ┌─────────────────────────────┐
                │   ONE Supabase project       │
                │   (Postgres + RLS + Storage  │
                │    + Auth + Edge Functions)  │
                └──────────────┬───────────────┘
                               │  shared contract
              ┌────────────────┴─────────────────┐
              ▼                                   ▼
   fethi-web  (mystreet-web)            fethi-mobile  (mystreet)
   Next.js admin + marketing            Expo React Native
   **DB OWNER**                         **CONSUMER**
   authors migrations,                  reads the contract,
   RLS, Edge Functions,                 never authors a migration
   seed, generated types
```

## 1. Roles

- **DB Owner = `fethi-web`.** It already runs the staff/admin surface (KYC,
  moderation, finance, disputes) that needs service-role access, so the database
  schema, RLS policies, Edge Functions, seed data, and generated types are
  authored **here and only here**.
- **Consumer = `fethi-mobile`.** It calls the contract (tables via RLS, Edge
  Functions) behind its `src/lib/api.ts` seam. It **must not** create migrations
  or Edge Functions. If mobile needs a schema/Edge change, it files an SCR
  (below) against `fethi-web`.
- A named human is the **DB reviewer** — every SCR and every migration PR needs
  their approval before merge. (Assign this on day 1; default: the web lead.)

## 2. The single source of truth

| Artifact | Canonical location | Mirrored to mobile as |
| --- | --- | --- |
| Migrations | `fethi-web/supabase/migrations/` | (not mirrored — web-only) |
| RLS policies | `fethi-web/supabase/migrations/` | (not mirrored) |
| Edge Functions | `fethi-web/supabase/functions/` | (not mirrored) |
| Seed | `fethi-web/supabase/seed.sql` | (not mirrored) |
| **Generated types** | `fethi-web/src/lib/database.types.ts` | `fethi-mobile/src/shared/types/database.types.ts` |
| **Human contract** | `fethi-web/docs/db/CONTRACT.md` | linked, not copied |
| Schema decisions | `fethi-web/docs/db/decisions/SCR-*.md` | linked, not copied |
| Web→mobile changelog | `fethi-web/docs/MOBILE-SYNC-NOTES.md` | read by mobile devs |
| Mobile→web requests | `fethi-mobile/docs/WEB-BACKEND-SYNC.md` | filed as SCRs here |

The **generated types file is the enforceable contract**: both apps `tsc`
against the same shape, so a schema change that isn't synced to mobile shows up
as a TypeScript error in mobile, not a production bug.

## 3. The Schema Change Request (SCR) gate — MANDATORY

**No task in either repo may change schema, RLS, an enum, or an Edge Function
contract without a merged SCR.** This is the rule that turns coordination from a
hope into a dependency edge on both boards.

Lifecycle:

```
1. PROPOSE   Author SCR-NNN.md in fethi-web/docs/db/decisions/ (copy SCR-TEMPLATE.md).
                - what changes, why, exact tables/columns/enums/indexes
                - RLS intent (who can read/write)
                - Edge Function signature if any
                - **Affected consumers**: which mobile + web tasks/screens depend on it
2. REVIEW    DB reviewer approves the SCR (shape + RLS + consumer impact).
3. MIGRATE   Author the migration in fethi-web/supabase/migrations/ (additive,
                timestamped, forward-only). Update RLS. Update Edge Functions.
4. REGEN     `pnpm db:types` → regenerate database.types.ts. Bump the version
                hash in its header. Update docs/db/CONTRACT.md.
5. SYNC      Update docs/MOBILE-SYNC-NOTES.md (web) AND copy database.types.ts
                into fethi-mobile/src/shared/types/. Note it in
                fethi-mobile/docs/WEB-BACKEND-SYNC.md.
6. MERGE     One PR carries: migration + RLS + types + CONTRACT + both sync
                notes + the SCR marked Accepted. The DB reviewer merges.
7. UNBLOCK   The consuming task(s) in either board move from Blocked → Ready.
```

**Additive, forward-only migrations.** Never edit a merged migration. To change
something, add a new migration. Never rename/drop a column the other app still
reads — add the new column, migrate readers, then remove in a later SCR.

**One open structural SCR at a time per table.** To avoid two devs writing
conflicting migrations on the same table, only one un-merged SCR may touch a
given table. Check `docs/db/decisions/` for open SCRs before proposing.

## 4. Bidirectional sync notes

- `fethi-web/docs/MOBILE-SYNC-NOTES.md` — append an entry **every** time a
  shared change ships: date, SCR id, what changed, what mobile must do.
- `fethi-mobile/docs/WEB-BACKEND-SYNC.md` — mobile devs read this before wiring
  any Supabase feature; they file needs back as SCRs here.

Both files are updated in the **same PR** as the schema change. A schema PR that
doesn't touch the sync notes fails review.

## 5. CI drift guard + the applied-SCRs manifest

The list of merged SCRs is tracked in a small manifest so the mobile board can
**programmatically block** a consumer task whose SCR hasn't shipped:

- Canonical: `fethi-web/supabase/applied-scrs.json` — web appends an SCR id here
  in the same PR that merges its migration + regenerated types.
- Vendored: `fethi-mobile/src/shared/types/applied-scrs.json` — copied from the
  canonical file in that same PR (alongside `database.types.ts`).

Enforcement:

- **Mobile gate (programmatic):** `pnpm check:scr TASK-XXX` reads the task's
  required `SCR-NNN` and the vendored manifest; it exits non-zero if the SCR
  isn't applied. `/build-task` runs it at step 1.5, so a mobile task **cannot
  reach `Review`** before its web SCR is real. CI-safe — reads only files
  committed in the mobile repo.
- **Web CI:** regenerate types and `git diff --exit-code` against the committed
  `database.types.ts`. Differ → someone changed the DB without committing types →
  fail.
- **Mobile CI:** run `pnpm check:scr` for each consumer task touched, and compare
  the vendored manifest/types against what web published. Stale → fail with "run
  the type sync."

This makes "I forgot to sync" and "I built ahead of the schema" both un-mergeable.

## 6. Cross-repo dependency map (the seam to watch)

These are the points where the two apps meet on the shared DB. Each consuming
task is `blockedBy` the producing SCR/task.

| Shared artifact (owned by web) | Web task | Mobile task that depends on it |
| --- | --- | --- |
| `profiles` + RLS + `public_profiles` view | WEB-003 | TASK-004 (profiles), TASK-005 (public reads) |
| `listings`/`categories`/`listing_photos` + RLS | WEB-003 | TASK-005 (read), TASK-006 (authoring) |
| `favorites`/`saved_searches` + RLS | WEB-003 | TASK-008 |
| `threads`/`messages` + RLS + Realtime | WEB-005 | TASK-007 |
| `offers`/`orders` + transition Edge Functions | WEB-005 | TASK-010 |
| Stripe PaymentIntent + Connect + webhook Edge Functions | WEB-006 | TASK-011 |
| `notifications` + push-dispatch Edge Function | WEB-007 | TASK-009 |
| account deletion/export + KYC-status Edge Functions | WEB-008 | TASK-014 |
| `reviews`/`reports` + RLS | WEB-008 | TASK-013 |

**Rule:** a mobile task that consumes a shared artifact may not reach `Review`
until the corresponding web SCR is `Accepted` and merged. The mobile board marks
this with a `Schema:` field and an external blocker (`blockedBy: SCR-NNN`).

## 7. Daily coordination ritual (10-day sprint)

- **Morning (10 min):** DB owner + both lanes scan open SCRs and the sync notes.
  Anything merged overnight → run the type sync, unblock dependents.
- **Before starting any Supabase task:** check the dependency map (§6). If your
  task needs a shared artifact that isn't merged yet, either build the
  non-DB parts behind the seam against the *typed contract* (mock the data) or
  pick a different task — do not fork the schema locally.
- **Schema changes land early in the day** so the other app has time to sync.

## 8. TL;DR

1. Web owns the DB. Mobile consumes.
2. No schema/RLS/Edge change without a merged **SCR**.
3. The **generated types** are the contract — both apps compile against them.
4. **Sync notes + types** ship in the same PR as the change.
5. CI fails on drift. The dependency map (§6) is the seam — respect the blockers.
