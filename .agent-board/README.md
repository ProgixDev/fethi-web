# Agent-board build workflow (fethi-web — DB OWNER)

How a board task goes from spec to merged PR, one task at a time, in dependency
order, with two developers in parallel lanes — and with the **database
coordination gate** that protects the shared Supabase backend.

## ⚠️ This repo owns the shared database

`fethi-web` is the canonical owner of the Supabase project that `fethi-mobile`
also uses. **No task may change schema / RLS / enums / Edge Functions without a
merged Schema Change Request (SCR).** Read `docs/db/COORDINATION.md` before any
backend task. The SCR gate is enforced inside `/build-task` (step 1.5).

## The loop in one line

`/next-task <lane>` → builds the next buildable task in that lane → opens a PR → CI runs → review + merge → `/next-task` again.

Two devs run it side by side: `/next-task Dev A` and `/next-task Dev B`.

## Per-task pipeline (what `/build-task` does)

1. **Grill** the spec with `/grill-with-docs` — mandatory.
2. **SCR gate** — if the task touches schema/RLS/enums/Edge Functions, an SCR must exist and be Accepted first, with `docs/MOBILE-SYNC-NOTES.md` + regenerated types in the PR.
3. **Build** behind the `src/lib/api.ts` seam.
4. **Review** against the required skills:
   - all tasks → **react-native-skills** is mobile-only; for web use general review + Next.js docs in `node_modules/next/dist/docs/`
   - any SQL / RLS / migrations / Supabase queries → **supabase-postgres-best-practices** + **supabase**
   - payment / Stripe Edge Functions → **stripe-integration-expert**
5. **Test** — `npm run typecheck` + `npm run lint` (mandatory gates). For DB tasks, also `npm run db:types` must be clean (no drift).
6. **Pass criteria** — tick only what's verified.
7. **PR** — branch `task/WEB-XXX` → `dev`, then stop.

## Commands

```
npm run board            # list tasks, flag BUILDABLE
npm run board:next       # next buildable task (any lane)
npm run board:next:a     # next buildable task in the Dev A lane
npm run board:next:b     # next buildable task in the Dev B lane
npm run db:types         # regenerate src/lib/database.types.ts from the live schema

node scripts/agent-board.mjs set-status WEB-XXX Done
npm run test:e2e e2e/tasks/WEB-XXX.spec.ts   # Playwright e2e (hard gate for UI/route tasks)
npm run skills:install   # restore pinned skills from skills-lock.json
```

## Skills & gates

- **Pinned skills** (`skills-lock.json`, restore with `npm run skills:install`):
  `supabase`, `supabase-postgres-best-practices`. `stripe-integration-expert` is
  available globally but not yet pinned (source not in the registry — pin once
  confirmed).
- **Hard gates** in `/build-task`: `npm run typecheck` + `npm run lint` always;
  `npm run test:e2e` (Playwright) for any task with a UI path or route handler;
  for DB tasks, `npm run db:types` must be clean and the SCR appended to
  `supabase/applied-scrs.json` + synced to mobile.
- Playwright needs a one-time `npm install` + `npx playwright install`.

## Rules the driver enforces

- A task is **buildable** only when every `blockedBy` is `Done`. An `SCR-*` blocker
  counts as not-done until the SCR is merged (add it to the board as Done, or
  remove the blocker, once Accepted) — this is the coordination gate in code.
- `/build-task` halts on a dirty tree.
- `/next-task <lane>` won't start a new task while that lane's PR is open.
- `board.json` is the source of truth; use `set-status`, never hand-edit three places.

## Lane discipline

- Dev A's backend tasks **unblock the mobile board** — land schema/Edge changes
  early in the day so mobile can sync types (see `board.md` cross-repo table).
- Dev B's admin UI consumes the schema Dev A ships; if the schema isn't merged,
  build the UI against the typed contract / mock data behind the seam.
