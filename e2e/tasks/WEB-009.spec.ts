import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// WEB-009 — User management wired to Supabase (browser e2e, MANDATORY gate).
//
// Flow: seed a throwaway non-staff user (auth admin API) + its profile row, sign
// in as the real staff admin through the login form, load /users, assert the
// seeded user renders from LIVE data, then suspend it from the detail screen and
// assert the staff action round-trips (status pill flips AND profiles.status is
// SUSPENDED in the DB AND an audit row was written by the service-role handler).
//
// Service-role key is read from env (.env.local, gitignored) — NEVER hardcoded,
// so the secret sweep stays clean. Run:
//   npx playwright test e2e/tasks/WEB-009.spec.ts

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

const stamp = Date.now();
const TEST_EMAIL = `web009.target.${stamp}@example.com`;
const TEST_NAME = `E2E Target ${stamp}`;
const TEST_NEIGHBORHOOD = `E2EQuartier${stamp}`;

let admin: SupabaseClient;
let targetId = '';

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local) to run the WEB-009 e2e.',
  );
  admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Throwaway non-staff auth user.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: `Pw!${stamp}aA`,
    email_confirm: true,
  });
  if (createErr || !created?.user) throw new Error(`seed user failed: ${createErr?.message}`);
  targetId = created.user.id;

  // 2) Its profile row (ACTIVE), so the admin list has live data to render.
  const { error: profErr } = await admin.from('profiles').insert({
    id: targetId,
    display_name: TEST_NAME,
    neighborhood: TEST_NEIGHBORHOOD,
    status: 'ACTIVE',
    kyc_status: 'UNVERIFIED',
  });
  if (profErr) throw new Error(`seed profile failed: ${profErr.message}`);
});

test.afterAll(async () => {
  if (!admin || !targetId) return;
  await admin.from('staff_audit_log').delete().eq('target_id', targetId);
  await admin.from('profiles').delete().eq('id', targetId);
  await admin.auth.admin.deleteUser(targetId).catch(() => {});
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test('staff signs in, sees the live user, and suspend round-trips', async ({ page }) => {
  await signIn(page);

  // Load the user list and search for the seeded user → proves live data renders.
  await page.goto('/users');
  await page.getByPlaceholder(/Rechercher/i).fill(TEST_NAME);
  const row = page.getByText(TEST_NAME, { exact: false }).first();
  await expect(row).toBeVisible({ timeout: 20_000 });

  // Open the detail and confirm the moderation panel shows ACTIVE.
  await page.goto(`/users/${targetId}`);
  const panel = page.getByTestId('user-moderation');
  await expect(panel).toBeVisible({ timeout: 20_000 });
  await expect(panel).toHaveAttribute('data-user-status', 'ACTIVE');

  // Suspend: click Suspendre → confirm in the dialog.
  await page.getByTestId('action-suspend').click();
  await page.getByTestId('confirm-action').click();

  // UI round-trip: the panel now reflects SUSPENDED.
  await expect(panel).toHaveAttribute('data-user-status', 'SUSPENDED', { timeout: 20_000 });

  // DB round-trip: the service-role handler persisted the status…
  const { data: prof } = await admin
    .from('profiles')
    .select('status')
    .eq('id', targetId)
    .single();
  expect(prof?.status).toBe('SUSPENDED');

  // …and audited the action (SCR-004), written by the route handler.
  const { data: audit } = await admin
    .from('staff_audit_log')
    .select('action, target_type, before, after')
    .eq('target_id', targetId)
    .eq('action', 'user.suspend');
  expect(audit && audit.length).toBeGreaterThan(0);
  expect(audit?.[0]?.target_type).toBe('user');
});

test('non-staff API caller is rejected (no service-role from the browser)', async ({ request }) => {
  // The status mutation must be staff-gated server-side. An unauthenticated call
  // to the route handler (no session cookie) is rejected — never executes.
  const res = await request.patch(`/api/admin/users/${targetId}/status`, {
    data: { status: 'BANNED' },
  });
  expect(res.status(), 'unauthenticated mutation must be denied').toBeGreaterThanOrEqual(401);
  expect(res.status()).toBeLessThan(404);

  // And the user is NOT banned.
  const { data: prof } = await admin
    .from('profiles')
    .select('status')
    .eq('id', targetId)
    .single();
  expect(prof?.status).not.toBe('BANNED');
});
