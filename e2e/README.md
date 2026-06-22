# Playwright E2E (web)

End-to-end tests for the MyStreet admin + marketing web app. A green local
`npm run test:e2e` is the **e2e gate** in `/build-task` for any task with a
user-facing path or a server route/webhook.

## Install (once)

```bash
npm install            # installs @playwright/test (in devDependencies)
npx playwright install # downloads the browser binaries
```

## Layout

- `admin.smoke.spec.ts` — admin app boots + login route renders (no auth).
- `tasks/WEB-XXX.spec.ts` — one spec per board task, authored during `/build-task`.
- `stripe-webhook.spec.ts` — the WEB-006 pattern: the Stripe webhook route is the
  source of truth, idempotent, and rejects unsigned/unauthorized calls. It hits
  the server **route handler** directly (service-role path), not the browser UI.

## Run

```bash
npm run test:e2e                       # all specs (auto-starts dev server)
npm run test:e2e e2e/tasks/WEB-010.spec.ts
E2E_BASE_URL=http://localhost:3000 npm run test:e2e   # against a running app
```

## Conventions

- Staff/RBAC states (admin/moderator/finance) need seeded users — add a seed
  step (mirror the mobile `scripts/seed-test-users.mjs` with the service role).
- Webhook tests use a test secret (`WEBHOOK_TEST_SECRET` / Stripe test signing);
  never embed live secrets. Assert idempotency (replay → no double effect) and
  401/400 on bad/missing signature.
- A task that ships a schema change must also pass `npm run db:types` clean — see
  `.agent-board/README.md` and `docs/db/COORDINATION.md`.
