# Mobile Sync Notes (web → mobile)

Append-only changelog of shared-database changes that **`fethi-mobile` must react
to**. Update this file in the **same PR** as any shared schema / RLS / enum /
Edge Function change. See `docs/db/COORDINATION.md`.

Each entry: date · SCR · what changed · what mobile must do.

---

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
