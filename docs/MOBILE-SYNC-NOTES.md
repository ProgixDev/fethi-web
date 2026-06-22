# Mobile Sync Notes (web → mobile)

Append-only changelog of shared-database changes that **`fethi-mobile` must react
to**. Update this file in the **same PR** as any shared schema / RLS / enum /
Edge Function change. See `docs/db/COORDINATION.md`.

Each entry: date · SCR · what changed · what mobile must do.

---

## 2026-06-21 · SCR-000 · Coordination protocol established

- **What:** `fethi-web` is the canonical owner of the shared Supabase database.
  All schema/RLS/Edge changes go through SCRs in `docs/db/decisions/`. Generated
  types (`src/lib/database.types.ts`) are the contract and are vendored into
  mobile at `src/shared/types/database.types.ts`.
- **Mobile must:** read `fethi-mobile/docs/WEB-BACKEND-SYNC.md`; do not author
  migrations; consume the contract behind `src/lib/api.ts`; file needs as SCRs
  here. No code action yet — types land with WEB-001.

<!-- New entries above this line, newest first. -->
