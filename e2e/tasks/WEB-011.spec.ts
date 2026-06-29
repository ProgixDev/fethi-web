import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// WEB-011 — Reports / moderation review workflow (browser e2e, MANDATORY gate).
//
// Flow: seed a throwaway reporter profile + an OPEN report (filed against that
// same user), sign in as the real staff admin, load /moderation (live queue
// renders the report), open its detail, and action it (→ ACTIONED) with a
// moderator note — asserting the staff action round-trips: reports.status →
// ACTIONED in the DB AND a `report.action` audit row (SCR-004, target_type
// 'report', reason = the note) written by the service-role handler. A second
// test proves the status route handler is staff-gated (unauth mutation rejected,
// report untouched).
//
// Service-role key from env (.env.local, gitignored) — NEVER hardcoded. Run:
//   npx playwright test e2e/tasks/WEB-011.spec.ts

// Serial: both tests share one seeded report + a single beforeAll. Avoids the
// fullyParallel race where two workers collide on the seed email AND hammer the
// cold Next dev server's single-threaded route compiler (→ "Failed to fetch").
// Retries absorb local-dev flakiness: this test hits THREE freshly-compiled
// /api/admin/reports* routes (on-demand cold compile under `npm run dev`) plus
// intermittent network to Supabase. CI uses `build && start` (precompiled), so
// the cold-compile latency is a local-only artifact.
test.describe.configure({ mode: 'serial', retries: 2 });

const NAV_TIMEOUT = 30_000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

const stamp = Date.now();
const REPORTER_EMAIL = `web011.reporter.${stamp}@example.com`;
const REPORT_REASON = `E2E spam ${stamp}`;

let admin: SupabaseClient;
let reporterId = '';
let reportId = '';

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local) to run the WEB-011 e2e.',
  );
  admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Throwaway reporter auth user + profile (reporter_id FK → profiles).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: REPORTER_EMAIL,
    password: `Pw!${stamp}aA`,
    email_confirm: true,
  });
  if (createErr || !created?.user) throw new Error(`seed reporter failed: ${createErr?.message}`);
  reporterId = created.user.id;

  const { error: profErr } = await admin.from('profiles').insert({
    id: reporterId,
    display_name: `E2E Reporter ${stamp}`,
    neighborhood: `E2EQuartier${stamp}`,
    status: 'ACTIVE',
    kyc_status: 'UNVERIFIED',
  });
  if (profErr) throw new Error(`seed profile failed: ${profErr.message}`);

  // 2) An OPEN report targeting that user (target context resolves to a profile).
  const { data: report, error: repErr } = await admin
    .from('reports')
    .insert({
      reporter_id: reporterId,
      target_type: 'USER',
      target_id: reporterId,
      reason: REPORT_REASON,
      details: 'Signalement de test e2e WEB-011.',
      status: 'OPEN',
    })
    .select('id')
    .single();
  if (repErr || !report) throw new Error(`seed report failed: ${repErr?.message}`);
  reportId = report.id;
});

test.afterAll(async () => {
  if (!admin) return;
  if (reportId) {
    await admin.from('staff_audit_log').delete().eq('target_id', reportId);
    await admin.from('reports').delete().eq('id', reportId);
  }
  if (reporterId) {
    await admin.from('profiles').delete().eq('id', reporterId);
    await admin.auth.admin.deleteUser(reporterId).catch(() => {});
  }
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test('staff sees the live report queue, then actions it with an audited note', async ({ page }) => {
  await signIn(page);

  // Live data renders in the moderation queue.
  await page.goto('/moderation');
  await expect(page.getByText(REPORT_REASON, { exact: false }).first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });

  // Open the detail and action the report with a moderator note.
  await page.goto(`/moderation/${reportId}`);
  await expect(page.getByText(REPORT_REASON, { exact: false }).first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  const note = `Traité e2e ${stamp}`;
  await page.getByPlaceholder(/Justifie ta décision/i).fill(note);
  await page.getByRole('button', { name: /Marquer comme traité/i }).click();

  // DB round-trip: status → ACTIONED.
  await expect
    .poll(
      async () => {
        const { data } = await admin
          .from('reports')
          .select('status')
          .eq('id', reportId)
          .single();
        return data?.status;
      },
      { timeout: 20_000 },
    )
    .toBe('ACTIONED');

  // Audit round-trip: a report.action row exists, target_type 'report', note kept.
  const { data: audit } = await admin
    .from('staff_audit_log')
    .select('action, target_type, reason')
    .eq('target_id', reportId)
    .eq('action', 'report.action');
  expect(audit && audit.length).toBeGreaterThan(0);
  expect(audit?.[0]?.target_type).toBe('report');
  expect(audit?.[0]?.reason).toBe(note);
});

test('report status route handler is staff-gated (unauth rejected)', async ({ request }) => {
  const res = await request.patch(`/api/admin/reports/${reportId}/status`, {
    data: { status: 'DISMISSED' },
  });
  expect(res.status(), 'unauthenticated moderation must be denied').toBeGreaterThanOrEqual(401);
  expect(res.status()).toBeLessThan(404);

  const { data } = await admin
    .from('reports')
    .select('status')
    .eq('id', reportId)
    .single();
  expect(data?.status).not.toBe('DISMISSED');
});
