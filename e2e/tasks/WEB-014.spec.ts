import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// WEB-014 — Analytics & reporting read models (browser e2e, MANDATORY gate).
//
// Flow: sign in as the real staff admin, load /analytics/users (real
// server-side aggregations from the staff-gated /api/admin/analytics/* route
// handlers, NOT client-side fixtures), and assert real aggregated content
// renders (the headings + KPI cards + a chart). We then cross-check the
// "Utilisateurs totaux" KPI against a service-role COUNT of `profiles`, proving
// the figure reflects the DB rather than a fixture. A second test proves the
// analytics route handler is staff-gated (unauth request rejected).
//
// Service-role key from env (.env.local, gitignored) — NEVER hardcoded. Run:
//   npx playwright test e2e/tasks/WEB-014.spec.ts
//
// Serial + retries: like WEB-011, these tests hammer freshly-compiled
// /api/admin/analytics/* routes under `npm run dev` (cold on-demand compile) and
// hit Supabase; retries absorb local-dev flakiness. CI uses build && start.
test.describe.configure({ mode: 'serial', retries: 2 });

const NAV_TIMEOUT = 30_000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

let admin: SupabaseClient;

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local) to run the WEB-014 e2e.',
  );
  admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT });
}

test('staff sees real aggregated analytics on /analytics/users, matching the DB', async ({
  page,
}) => {
  await signIn(page);

  await page.goto('/analytics/users');

  // The page heading + a KPI card render (real route, not the marketing fixture).
  await expect(
    page.getByRole('heading', { name: /Analytique — utilisateurs/i }),
  ).toBeVisible({ timeout: NAV_TIMEOUT });
  await expect(page.getByText('Utilisateurs totaux', { exact: false }).first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });

  // The total-users KPI resolves to a number (the "—" placeholder is replaced
  // once the aggregation responds). Target the KPIStat card (div.rounded-lg
  // holding the exact label) and read ONLY its value paragraph (p.text-h2) —
  // reading the whole card/dashboard would concatenate every number on screen.
  const totalValue = page
    .locator('div.rounded-lg', { has: page.getByText('Utilisateurs totaux', { exact: true }) })
    .first()
    .locator('p.text-h2')
    .first();
  await expect
    .poll(
      async () => {
        const txt = (await totalValue.innerText()).replace(/[^\d]/g, '');
        return txt.length > 0 ? Number(txt) : null;
      },
      { timeout: NAV_TIMEOUT },
    )
    .not.toBeNull();

  // Cross-check the rendered total against a service-role COUNT of `profiles`.
  const { count } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  const dbTotal = count ?? 0;

  const rendered = Number((await totalValue.innerText()).replace(/[^\d]/g, ''));
  expect(rendered).toBe(dbTotal);

  // A chart (recharts SVG) renders for the period.
  await expect(page.locator('.recharts-responsive-container').first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
});

test('analytics route handler is staff-gated (unauth rejected)', async ({ request }) => {
  const res = await request.get('/api/admin/analytics/users/summary');
  expect(res.status(), 'unauthenticated analytics read must be denied').toBeGreaterThanOrEqual(401);
  expect(res.status()).toBeLessThan(404);
});
