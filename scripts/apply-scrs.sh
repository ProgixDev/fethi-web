#!/usr/bin/env bash
# Apply SCR migrations to the shared Supabase project via the Management API
# (curl — the only path that works in this env: no Docker, direct DB host is
# IPv6-only). Then regenerate the typed contract and vendor it into fethi-mobile.
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx bash scripts/apply-scrs.sh \
#     supabase/migrations/20260625120000_scr005_store_compliance.sql \
#     supabase/migrations/20260625130000_scr006_mark_thread_read.sql
#
# Requires: SUPABASE_ACCESS_TOKEN (sbp_ personal access token) in the env.
set -euo pipefail

REF="${SUPABASE_PROJECT_ID:-lksjbehxpfndviesnlgm}"
WEB_DIR="/Users/macbookpro/Documents/Progix/fethi-web"
MOBILE_DIR="/Users/macbookpro/Documents/Progix/fethi-mobile"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "ERROR: SUPABASE_ACCESS_TOKEN (sbp_...) is not set." >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  echo "ERROR: pass one or more migration .sql files to apply." >&2
  exit 1
fi

api="https://api.supabase.com/v1/projects/${REF}/database/query"

for sql_file in "$@"; do
  [ -f "$sql_file" ] || { echo "ERROR: missing $sql_file" >&2; exit 1; }
  echo "==> applying $(basename "$sql_file")"
  body="$(mktemp)"
  # Build the JSON body safely (json-encode the whole SQL file as {"query": ...}).
  python3 - "$sql_file" >"$body" <<'PY'
import json, sys
with open(sys.argv[1], "r", encoding="utf-8") as f:
    print(json.dumps({"query": f.read()}))
PY
  resp="$(curl -sS -X POST "$api" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    --data-binary @"$body")"
  rm -f "$body"
  # The Management API returns [] on success for DDL; an object with "message"
  # on error. Fail loudly if we see an error message.
  if echo "$resp" | python3 -c 'import json,sys; d=json.load(sys.stdin); sys.exit(1 if isinstance(d,dict) and d.get("message") else 0)' 2>/dev/null; then
    echo "    ok"
  else
    echo "    FAILED: $resp" >&2
    exit 1
  fi
done

echo "==> regenerating types (db:types via --project-id, no Docker)"
cd "$WEB_DIR"
SUPABASE_PROJECT_ID="$REF" SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npm run db:types

echo "==> appending SCR-005, SCR-006 to applied-scrs.json (both repos)"
python3 - "$WEB_DIR/supabase/applied-scrs.json" <<'PY'
import json, sys
p = sys.argv[1]
d = json.load(open(p))
for scr in ("SCR-005", "SCR-006"):
    if scr not in d["applied"]:
        d["applied"].append(scr)
json.dump(d, open(p, "w"), indent=2)
open(p, "a").write("\n")
print("  web applied-scrs:", d["applied"])
PY

echo "==> vendoring types + applied-scrs into fethi-mobile"
cp "$WEB_DIR/src/lib/database.types.ts" "$MOBILE_DIR/src/shared/types/database.types.ts"
cp "$WEB_DIR/supabase/applied-scrs.json" "$MOBILE_DIR/src/shared/types/applied-scrs.json"

echo "==> done. Next: typecheck both repos + commit the vendored types."
