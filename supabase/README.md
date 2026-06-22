# supabase/ — the shared MyStreet database home (fethi-web is DB OWNER)

This repo authors **all** schema, RLS, Edge Functions, seed, and the generated
types for the ONE shared Supabase project. `fethi-mobile` only consumes them.
The full protocol is **`../docs/db/COORDINATION.md`** — read it before changing
anything here. No schema change without an accepted **SCR**
(`../docs/db/decisions/`).

```
supabase/
  config.toml        # local stack config; project_id = linked remote ref
  migrations/        # forward-only, additive. Authored ONLY here, via an SCR.
  functions/         # Edge Functions (Deno). Authored ONLY here.
  seed.sql           # local seed (supabase db reset)
  applied-scrs.json  # CANONICAL list of merged SCRs (vendored to mobile)
```

## CLI — pinned, match CI

The Supabase CLI is pinned as a devDependency (`supabase` in `package.json`), so
`npm install` gives every dev and CI the **same** version. Invoke it via the npm
scripts or `npx supabase ...` — do not rely on a globally-installed CLI that may
drift from CI.

## Regenerate the type contract — `npm run db:types`

`src/lib/database.types.ts` is the **enforceable cross-repo contract**: both apps
`tsc` against it. Regenerate it whenever the schema changes (always in the same PR
as the migration). The script (`scripts/db-types.mjs`) writes a deterministic
`schema-version` hash header so the `db-drift` CI only fails on real drift.

Sources (the script auto-selects):

- **Local:** set `SUPABASE_DB_URL` (direct Postgres connection string) in
  `.env.local` — no access token needed.
- **CI / token mode:** set `SUPABASE_PROJECT_ID` + `SUPABASE_ACCESS_TOKEN`.

## Vendor the contract to mobile (same PR as any schema change)

When `database.types.ts` or `applied-scrs.json` changes, copy both into the mobile
repo in the **same PR** (COORDINATION.md §5):

```bash
cp src/lib/database.types.ts        ../fethi-mobile/src/shared/types/database.types.ts
cp supabase/applied-scrs.json       ../fethi-mobile/src/shared/types/applied-scrs.json
```

Then update `../docs/MOBILE-SYNC-NOTES.md` (web→mobile changelog) and
`../fethi-mobile/docs/WEB-BACKEND-SYNC.md`. A schema PR that skips the sync notes
or the vendoring fails review / the drift guard.
