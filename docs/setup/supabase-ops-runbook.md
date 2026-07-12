# Runbook — Supabase ops (migrations, secrets, functions, types)

How schema changes, Edge secrets, function deploys, and type regeneration are
applied to the shared project **without** the local Docker/CLI-link path (which
is blocked here: Docker + IPv6 + the CLI's DB link don't work locally). Everything
goes through the **Management API** (`https://api.supabase.com`) or the vendored
Supabase Go binary. Companion to the `progix-supabase-apply-path` memory.

Project ref: `lksjbehxpfndviesnlgm`

## Credentials (never commit; read from gitignored `.env.local`)

| Key in `.env.local` | Prefix | Use |
| --- | --- | --- |
| `SUPABASE_ACCESS_TOKEN` | `sbp_` | **Management API** (migrations, types, secrets, deploy). A personal access token — **rotates between sessions**, always re-read the current value. |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_` | DB writes bypassing RLS (REST as service role). **401s on the Management API** — not interchangeable with the PAT. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_` | anon/client key (sign-in, RLS-scoped REST). |

Key-type gotcha: `sbp_` = PAT (management), `sb_secret_` = service-role (DB only),
`sb_publishable_` = anon. Using the wrong one is the most common failure.

```bash
# Read the current PAT into a shell var (do NOT write secrets to new files).
cd fethi-web
PAT=$(grep -E "^SUPABASE_ACCESS_TOKEN=" .env.local | cut -d= -f2)
REF=lksjbehxpfndviesnlgm
```

## 1. Run SQL / apply a migration

```bash
run_sql() {
  curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
    -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" -d "$1"
}
# ad-hoc query
run_sql '{"query":"select count(*) from public.orders;"}'

# apply a migration file (safely JSON-encode the whole file)
SQL=$(python3 -c "import json; print(json.dumps({'query': open('supabase/migrations/<file>.sql').read()}))")
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/database/query" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" -d "$SQL"
# empty `[]` response = success
```

Migrations are still written as versioned files under `supabase/migrations/`
(the canonical record) even though they're applied via the API rather than
`supabase db push`. Keep them forward-only.

## 2. Regenerate + vendor types

The canonical path is `npm run db:types` (CLI). When the CLI can't run, use the
Management API types endpoint and reproduce the deterministic header the script
writes (sha256 of the body, first 12 chars):

```bash
curl -s "https://api.supabase.com/v1/projects/$REF/types/typescript" \
  -H "Authorization: Bearer $PAT" -o /tmp/types.json
python3 - <<'PY'
import json, hashlib
body = json.load(open("/tmp/types.json"))["types"].rstrip() + "\n"
h = hashlib.sha256(body.encode()).hexdigest()[:12]
header = ("/**\n * AUTO-GENERATED — DO NOT EDIT BY HAND. Run `npm run db:types`.\n"
          " *\n * ...cross-repo contract...\n *\n"
          f" * schema-version: {h}\n */\n\n")
open("src/lib/database.types.ts", "w").write(header + body)
print("schema-version", h)
PY
# vendor to mobile IN THE SAME change:
cp src/lib/database.types.ts ../fethi-mobile/src/shared/types/database.types.ts
```

Then update the manifests (see §5). Both repos must carry byte-identical
`database.types.ts`; CI diffs the schema-version hash.

## 3. Set an Edge secret

Preferred: **Dashboard → Project Settings → Edge Functions → Secrets**. Via API:

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/$REF/secrets" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d '[{"name":"REVENUECAT_WEBHOOK_AUTH","value":"<secret>"}]'
```

Functions read secrets via `Deno.env.get('NAME')`. A missing secret should make
the function return `503 *_unconfigured` (inert), not 500 — see the existing
functions for the pattern.

## 4. Deploy an Edge Function

The npm `supabase` wrapper is **broken here** (it looks for
`node_modules/@supabase/cli-<os>-<arch>/bin/supabase`, but the binary ships as
`bin/supabase-go`). Invoke the platform binary directly:

```bash
export SUPABASE_ACCESS_TOKEN=$PAT
SB=node_modules/@supabase/cli-darwin-x64/bin/supabase-go   # adjust cli-<os>-<arch>

$SB functions deploy <slug> --project-ref $REF                 # verify_jwt=true
$SB functions deploy <slug> --project-ref $REF --no-verify-jwt # self-verified webhooks
```

- Deploy does **not** need Docker (only local `functions serve` does — the
  `WARNING: Docker is not running` line is harmless).
- `--no-verify-jwt` is for webhooks that self-verify a shared secret
  (`stripe-webhook`, `revenuecat-webhook`, `notifications-dispatch`); everything
  else keeps `verify_jwt=true`.
- Shared code under `supabase/functions/_shared/` is bundled automatically.

## 5. SCR workflow (the full cross-repo dance)

When a change adds/alters a shared DB artifact:

1. Write `supabase/migrations/<ts>_scrNNN_<name>.sql` + `docs/db/decisions/SCR-NNN.md`.
2. Apply it (§1) and verify live (§7).
3. Regenerate + vendor types (§2).
4. Append the id to **`supabase/applied-scrs.json`** and copy it to
   `../fethi-mobile/src/shared/types/applied-scrs.json`.
5. If a function was deployed, append its slug to
   **`supabase/edge-functions.json`** and vendor that too.
6. Add the task's requirement row to mobile
   `scripts/check-scr.mjs` (`TASK_REQUIREMENTS`).
7. Log the reaction in `fethi-mobile/docs/WEB-BACKEND-SYNC.md`.

These three vendored manifests (`database.types.ts`, `applied-scrs.json`,
`edge-functions.json`) are the contract the mobile coordination gate reads.

## 6. Production-change approval

Applying migrations, setting secrets, and deploying functions are **production
changes** — the harness's auto-mode classifier gates them and needs the action
named/approved before it runs. Batch related prod changes and get one approval
rather than firing them piecemeal.

## 7. Verify live under RLS

Exercise real policies with a test-user JWT (not the service role, which bypasses
RLS):

```bash
ANON=$(grep -E "^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=" .env.local | cut -d= -f2)
URL=https://$REF.supabase.co
JWT=$(curl -s -X POST "$URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"maestro+verified@mystreet.test","password":"Maestro-Test-1!"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
# then hit /rest/v1/<table> or /functions/v1/<slug> with:
#   -H "apikey: $ANON" -H "Authorization: Bearer $JWT"
```

Seed test users with `node scripts/seed-test-users.mjs` (password
`Maestro-Test-1!`). Clean up any fixtures you insert with the service-role key.

## Quick reference

| Task | Path |
| --- | --- |
| Run SQL / migrate | `POST /v1/projects/$REF/database/query` |
| Regenerate types | `GET /v1/projects/$REF/types/typescript` |
| Set secret | `POST /v1/projects/$REF/secrets` |
| Deploy function | `supabase-go functions deploy <slug> --project-ref $REF` |
| Test-user JWT | `POST /auth/v1/token?grant_type=password` |
