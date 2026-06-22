#!/usr/bin/env node
/**
 * db:types — regenerate the enforceable cross-repo type contract.
 *
 * Runs `supabase gen types typescript` and writes src/lib/database.types.ts with a
 * DETERMINISTIC version-hash header (sha256 of the generated body). Deterministic so
 * the drift CI (`git diff --exit-code`) only fails when the SCHEMA actually changed
 * without the types being committed — not on every run.
 *
 * Source: it prefers SUPABASE_DB_URL (direct connection, no access token needed —
 * handy locally), and otherwise falls back to --project-id $SUPABASE_PROJECT_ID
 * (needs SUPABASE_ACCESS_TOKEN, the mode CI uses).
 *
 * See docs/db/COORDINATION.md §2/§5. After this file changes, the SAME PR must
 * vendor it into fethi-mobile/src/shared/types/database.types.ts.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/lib/database.types.ts');

function fail(msg) {
  console.error(`\n[db:types] ${msg}\n`);
  process.exit(1);
}

const dbUrl = process.env.SUPABASE_DB_URL;
const projectId = process.env.SUPABASE_PROJECT_ID;

let args;
if (dbUrl) {
  args = ['gen', 'types', 'typescript', '--db-url', dbUrl];
} else if (projectId) {
  if (!process.env.SUPABASE_ACCESS_TOKEN) {
    fail(
      'SUPABASE_PROJECT_ID is set but SUPABASE_ACCESS_TOKEN is missing.\n' +
        '  Either `export SUPABASE_ACCESS_TOKEN=sbp_...` (a Supabase access token),\n' +
        '  or set SUPABASE_DB_URL to a direct Postgres connection string.',
    );
  }
  args = ['gen', 'types', 'typescript', '--project-id', projectId];
} else {
  fail(
    'No source configured. Set SUPABASE_PROJECT_ID (+ SUPABASE_ACCESS_TOKEN), or\n' +
      '  SUPABASE_DB_URL to a direct Postgres connection string.',
  );
}

// Resolve the pinned local CLI (devDependency `supabase`); fall back to PATH.
function runCli() {
  const attempts = [
    ['npx', ['--no-install', 'supabase', ...args]],
    ['supabase', args],
  ];
  let lastErr;
  for (const [cmd, cmdArgs] of attempts) {
    try {
      return execFileSync(cmd, cmdArgs, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (err) {
      lastErr = err;
    }
  }
  fail(
    'supabase CLI invocation failed. Is the pinned `supabase` devDependency installed ' +
      '(`npm install`)?\n  ' + (lastErr?.stderr || lastErr?.message || lastErr),
  );
}

const body = runCli().trimEnd() + '\n';
const hash = createHash('sha256').update(body).digest('hex').slice(0, 12);

const header =
  `/**\n` +
  ` * AUTO-GENERATED — DO NOT EDIT BY HAND. Run \`npm run db:types\`.\n` +
  ` *\n` +
  ` * Enforceable cross-repo contract: both fethi-web and fethi-mobile tsc against this\n` +
  ` * shape. When it changes, the SAME PR must vendor it into\n` +
  ` * fethi-mobile/src/shared/types/database.types.ts and update docs/MOBILE-SYNC-NOTES.md\n` +
  ` * + supabase/applied-scrs.json (see docs/db/COORDINATION.md §2/§5).\n` +
  ` *\n` +
  ` * schema-version: ${hash}\n` +
  ` */\n\n`;

writeFileSync(OUT, header + body);
console.error(`[db:types] wrote src/lib/database.types.ts (schema-version ${hash})`);
