# SCR-NNN — <short title>

Status: Proposed   <!-- Proposed | Accepted | Rejected | Superseded by SCR-XYZ -->
Date: YYYY-MM-DD
Author: <name>
DB reviewer: <name>
Migration: <supabase/migrations/NNN_*.sql or "pending">

## What changes

<Concrete: the exact tables, columns, types, enums, indexes, RLS policies, or
Edge Function signatures being added/changed. Forward-only and additive — say so.>

## Why

<The product/task need driving this. Link the board task id(s).>

## RLS intent

<Who can SELECT/INSERT/UPDATE/DELETE which rows. Authenticated + ownership
predicate? Public read? Service-role only (Edge Function)? Be explicit — this is
the security surface.>

## Edge Function (if any)

<Name, HTTP signature, auth (user JWT vs service role), idempotency, secrets used
(must be Edge secrets, never EXPO_PUBLIC/NEXT_PUBLIC).>

## Affected consumers

<Which mobile tasks/screens and which web tasks/screens depend on this. Pull from
docs/db/COORDINATION.md §6. List the board task ids that this SCR unblocks.>

- Mobile: TASK-___
- Web: W-___

## Migration plan

- [ ] Migration authored in `supabase/migrations/` (additive, timestamped).
- [ ] RLS policies added/updated.
- [ ] `pnpm db:types` regenerated `src/lib/database.types.ts`; version hash bumped.
- [ ] `docs/db/CONTRACT.md` updated.
- [ ] `docs/MOBILE-SYNC-NOTES.md` entry added.
- [ ] Types copied to `fethi-mobile/src/shared/types/database.types.ts`; mobile
      `docs/WEB-BACKEND-SYNC.md` updated.

## Rollback / compatibility

<Is this safe for the other app already in production? If a column is being
removed, what is the deprecation path (add new → migrate readers → remove later)?>
