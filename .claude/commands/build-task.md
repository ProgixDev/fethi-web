---
description: Full agent-board pipeline for one fethi-web task — grilling, SCR/coordination gate, build behind the api.ts seam, skill review, typecheck + lint, open PR.
argument-hint: WEB-XXX
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Skill
---

You are running the **single-task build pipeline** for `$ARGUMENTS` (a board id like `WEB-005`).

Work in order. **Stop and report** if any step fails or a precondition is unmet. Do not green-tick what you did not verify.

## 0. Preconditions

1. `node scripts/agent-board.mjs list` — confirm `$ARGUMENTS` is `BUILDABLE`. If not, say which blocker (including any unmerged `SCR-*`) is open and stop.
2. Clean working tree (`git status`); if dirty, stop and ask.
3. Branch `task/$ARGUMENTS` off latest `dev` (`git fetch`, branch from `origin/dev`).
4. `node scripts/agent-board.mjs set-status $ARGUMENTS "In Progress"`.

## 1. Grill the spec — MANDATORY

Read `.agent-board/tasks/$ARGUMENTS.md`, then **run `/grill-with-docs`** against it. Drive it to completion as the decision-maker; fold resolved decisions + edge cases back into the task file's Scope / Acceptance Criteria / Edge Cases / Verification. Record genuine product questions in `docs/next-meeting-questions.md` with a sensible MVP default.

## 1.5. SCR / coordination gate — MANDATORY for any DB change

`fethi-web` owns the shared Supabase DB. **If this task adds or changes any table, column, enum, RLS policy, or Edge Function contract:**

1. Confirm an **Accepted** SCR exists in `docs/db/decisions/` for this change. If none, create one from `docs/db/SCR-TEMPLATE.md`, fill **RLS intent** + **Affected consumers** (pull from `docs/db/COORDINATION.md` §6), and drive it to a decision yourself with a sensible default (mark it Accepted with your rationale, flag for human ratification in the PR).
2. The migration must be **additive + forward-only** in `supabase/migrations/`; never edit a merged migration; never drop/rename a column the mobile app still reads.
3. After the migration: `npm run db:types` to regenerate `src/lib/database.types.ts`, bump its version hash, update `docs/db/CONTRACT.md`.
4. Update `docs/MOBILE-SYNC-NOTES.md` with the change, and copy the regenerated types into `fethi-mobile/src/shared/types/database.types.ts` (note it in mobile's `docs/WEB-BACKEND-SYNC.md`).
5. All of the above ships in **this one PR**. A schema PR without sync notes + regenerated types must not open.

If the task touches **no** DB schema/RLS/Edge contract, skip this step and note "no schema change" in the PR.

## 2. Build the task

Implement the scope behind `src/lib/api.ts` (swap implementation, keep interface). Only `NEXT_PUBLIC_*` in client code; service-role keys only in Edge Functions / server route handlers. This is a recent Next.js — read the relevant guide in `node_modules/next/dist/docs/` before writing route/handler code (see AGENTS.md).

## 3. Convention review — use the task's required skills

- Any SQL / RLS / migrations / Supabase queries → invoke **supabase-postgres-best-practices** and **supabase**.
- Stripe / payment Edge Functions → invoke **stripe-integration-expert**.
Fix what they surface; summarize anything you deliberately skipped.

## 3.5. Author the e2e — MANDATORY, no task is exempt

Every task ships a passing end-to-end test. Write/update `e2e/tasks/$ARGUMENTS.spec.ts` covering this task's critical path + grilled edge cases (see `e2e/README.md`, `e2e/admin.smoke.spec.ts`, and `e2e/stripe-webhook.spec.ts`). Webhook / service-role flows hit the server route handler directly and must assert idempotency + signature rejection.

**There is no "pure-config" exemption.** If the task has no UI path, it still ships an *equivalent* e2e that exercises the real artifact end-to-end — pick the one that fits:
- **Schema / RLS / migration** → assert the contract against the **live DB with the anon (publishable) key**: public reads succeed, owner-only/private rows are blocked, enums/columns exist (see `e2e/README.md` "contract e2e").
- **Auth / guards / middleware (proxy)** → drive the real flow in a browser (Playwright against `npm run dev`): unauth redirect, sign-in, authed access, session persistence.
- **Tooling / client setup with no route** → a boot smoke that loads the built app and asserts it renders with the new code in the graph, with zero fatal errors.

Whatever the task, the PR must link the e2e file/output. "No e2e" is never an acceptable answer.

## 4. Test — MANDATORY gates

Paste real output of:
- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e e2e/tasks/$ARGUMENTS.spec.ts` — the e2e run is a **hard, non-skippable gate for every task** (§3.5 defines the equivalent e2e for non-UI tasks; needs `npx playwright install` once). If the e2e can't run or fails, **HALT and report — do not open the PR or mark the task Done.** A task without a passing (or explicitly justified `manual`, human-ratified) e2e cannot reach Review.
- For DB tasks: `npm run db:types` then `git diff --exit-code src/lib/database.types.ts` (must be clean — proves types match the migration), and append the SCR id to `supabase/applied-scrs.json` + copy it (with the types) into `fethi-mobile/src/shared/types/`.

Fix failures before continuing.

## 5. Update pass criteria

Tick verified Acceptance / Pass criteria in the task file; annotate `manual` what needs a human/booted backend. Then `node scripts/agent-board.mjs set-status $ARGUMENTS "Review"`.

## 6. Open the PR

Commit on `task/$ARGUMENTS`, open a PR into `dev` with `gh pr create`. Body must list: what was built; grilling-driven refinements; **the SCR id + cross-repo impact** (or "no schema change"); typecheck + lint results; green vs `manual` pass criteria; and "Merges only after a human reviews + approves."

## 7. Report back

End with: PR url, board transition, and the lane's next task (`node scripts/agent-board.mjs next --lane "<owner>"`). If this task changed the schema, also remind: **mobile must sync types** (`docs/MOBILE-SYNC-NOTES.md`). Do not merge; do not start the next task.
