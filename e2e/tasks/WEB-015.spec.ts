import { expect, test } from '@playwright/test';

// WEB-015 — Marketing site + waitlist/referral (browser e2e, PUBLIC surface).
//
// Unlike the admin specs, this exercises the ONLY fully-public, no-auth surface:
// the marketing landing page and its waitlist signup. No login, no seeded user,
// no Supabase — the waitlist endpoint `POST /api/marketing/waitlist` is a
// PUBLIC Next route handler with a deferred-persistence stub (no `waitlist`
// table yet; see WEB-015 Coordination). The tests assert: (1) the landing page
// renders anonymously with SEO metadata, (2) a unique email submits to a success
// state, (3) the SAME email submitted again hits the friendly duplicate state,
// and (4) the route handler rejects an empty/bad email with a 4xx.
//
// Run (do NOT run during parallel agent work — another agent holds the dev port):
//   npx playwright test e2e/tasks/WEB-015.spec.ts

// Serial: tests 2 + 3 depend on the same email being seen first (non-duplicate)
// then again (duplicate). The handler dedupes in-process, so order matters and
// parallel workers would race the shared Set. Retries absorb cold dev-server
// route-compile flakiness (same rationale as WEB-011).
test.describe.configure({ mode: 'serial', retries: 2 });

const NAV_TIMEOUT = 30_000;

// One unique email shared by the submit + duplicate tests.
const stamp = Date.now();
const WAITLIST_EMAIL = `web015.waitlist.${stamp}@example.com`;

test('marketing landing page renders anonymously with SEO metadata', async ({ page }) => {
  await page.goto('/');

  // App HTML rendered (not a crash) on the public surface — no redirect to /login.
  await expect(page.locator('body')).toBeVisible();
  await expect(page).not.toHaveURL(/login/);

  // SEO: a non-empty <title> and a meta description are present.
  await expect(page).toHaveTitle(/MyStreet/i, { timeout: NAV_TIMEOUT });
  const description = page.locator('head meta[name="description"]');
  await expect(description).toHaveAttribute('content', /.+/);

  // The waitlist signup form is reachable on the landing page.
  await expect(page.getByPlaceholder('vous@quartier.fr').first()).toBeVisible();
});

test('submitting a unique email reaches the waitlist confirmation', async ({ page }) => {
  await page.goto('/');

  const emailInput = page.getByPlaceholder('vous@quartier.fr').first();
  await emailInput.fill(WAITLIST_EMAIL);
  // Submit the hero waitlist form (first "Rejoindre la liste" CTA).
  await page.getByRole('button', { name: /Rejoindre la liste/i }).first().click();

  // First (non-duplicate) submit navigates to the confirmation page.
  await page.waitForURL(/\/waitlist\/confirmed/, { timeout: NAV_TIMEOUT });
  await expect(page.getByText(/Merci/i).first()).toBeVisible();
});

test('resubmitting the same email shows the friendly duplicate state', async ({ page }) => {
  await page.goto('/');

  const emailInput = page.getByPlaceholder('vous@quartier.fr').first();
  await emailInput.fill(WAITLIST_EMAIL);
  await page.getByRole('button', { name: /Rejoindre la liste/i }).first().click();

  // Duplicate is handled inline (no navigation, no error) with an already-on-the-list status.
  await expect(page.getByText(/déjà sur la liste/i).first()).toBeVisible({ timeout: NAV_TIMEOUT });
  await expect(page).not.toHaveURL(/\/waitlist\/confirmed/);
});

test('waitlist route handler rejects an empty/bad email with a 4xx', async ({ request }) => {
  // Empty email → 4xx validation error.
  const empty = await request.post('/api/marketing/waitlist', {
    data: { email: '' },
  });
  expect(empty.status(), 'empty email must be rejected').toBeGreaterThanOrEqual(400);
  expect(empty.status()).toBeLessThan(500);

  // Malformed email → 4xx validation error.
  const bad = await request.post('/api/marketing/waitlist', {
    data: { email: 'not-an-email' },
  });
  expect(bad.status(), 'malformed email must be rejected').toBeGreaterThanOrEqual(400);
  expect(bad.status()).toBeLessThan(500);
});
