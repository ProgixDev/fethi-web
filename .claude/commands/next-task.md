---
description: Supervised-loop step (fethi-web) — verify the lane's last PR is green/merged, then build the next buildable board task for that lane.
argument-hint: "[Dev A|Dev B]"
allowed-tools: Bash, Read, Edit, Write, Glob, Grep, Skill
---

You are one **supervised iteration** of the MyStreet **web** agent-board loop, for the lane in `$ARGUMENTS` (`Dev A` or `Dev B`; if omitted, all lanes). Never start a new task in a lane while that lane's previous PR is open and unmerged. Gate: `npm run typecheck` + `npm run lint` green + human review.

Remember: **fethi-web owns the shared database.** Dev A's backend tasks unblock the mobile board — coordinate via SCRs (`docs/db/COORDINATION.md`).

## 1. Reconcile merged work → Done

`gh pr list --state merged --search "head:task/" --limit 10 --json number,headRefName`. For each merged `task/WEB-XXX` PR whose board task is not yet `Done`, run `node scripts/agent-board.mjs set-status WEB-XXX Done`. If a merged task shipped a schema change, confirm `docs/MOBILE-SYNC-NOTES.md` was updated and the mobile team has been pinged to sync types.

## 2. Guard: is this lane's previous task settled?

`gh pr list --state open --search "head:task/" --json number,headRefName,title,statusCheckRollup,reviewDecision`.

- If an open `task/WEB-XXX` PR exists **owned by this lane**, stop and report its CI + review state. Do not build in this lane. (An open PR in the other lane does not block you.)
- Green + approved but unmerged → offer to `gh pr merge --squash` but wait for go-ahead.
- No open PRs for this lane → continue.

**Fail closed:** if the `--search` query errors or is uncertain, re-check the latest task PR directly (`gh pr view <n> --json state`) and halt unless you can positively confirm no open task PR for this lane.

## 3. Pick the next task

`node scripts/agent-board.mjs next --lane "$ARGUMENTS"`.
- `NONE` → report this lane has no buildable task (note if it's blocked on an unmerged SCR) and stop.
- Otherwise take the `id`.

## 4. Build it

Run `/build-task` for that id to completion (it opens the PR and stops).

## 5. Hand back

Report the PR url; remind the user this lane is paused until that PR is green + approved. Continue with `/next-task $ARGUMENTS` after merging.
