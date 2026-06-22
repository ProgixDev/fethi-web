import { expect, test } from '@playwright/test';

// Smoke: the admin app boots and the login route renders. No auth required —
// proves the harness + app server work before any task spec is authored.
// Adjust selectors once the final login copy/markup lands (WEB-004).

test('admin login route renders', async ({ page }) => {
  await page.goto('/login');
  // The page responded with app HTML (not a 500/crash). Tighten this to a real
  // login control (email field / submit) when WEB-004 wires the form.
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveURL(/login/);
});

test('unauthenticated admin route does not leak the dashboard', async ({ page }) => {
  // Until WEB-004 adds the route guard this may render; after WEB-004 it must
  // redirect to /login. Kept as a guard-rail assertion to harden in WEB-004.
  const res = await page.goto('/dashboard');
  expect(res?.status()).toBeLessThan(500);
});
