import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// WEB-020 — dashboard data half (browser e2e, MANDATORY gate).
//
// Scope covered here: GMV/signups trend + KPI sparklines now come from the
// real analytics read models (analyticsApi.marketplace / signupsTrend, WEB-014)
// instead of `@/lib/fixtures/metrics`, and the activity feed — which has no
// backend read model yet — is visibly labeled "Exemple" rather than presented
// as live data.
//
// Flow: sign in as the real staff admin, load /dashboard, and assert the GMV
// chart renders from the live `/api/admin/analytics/marketplace` +
// `/api/admin/analytics/users/signups-trend` endpoints (not the fixture shape
// — cross-checked against a service-role read of `orders`), and that the
// activity section carries the "Exemple" pill.
//
// Service-role key from env (.env.local, gitignored) — NEVER hardcoded. Run:
//   npx playwright test e2e/tasks/WEB-020-dashboard.spec.ts
//
// Serial + retries: same rationale as WEB-014 — freshly-compiled routes under
// `npm run dev` (cold on-demand compile) hitting Supabase; retries absorb
// local-dev flakiness. CI uses build && start.
test.describe.configure({ mode: 'serial', retries: 2 });

const NAV_TIMEOUT = 30_000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

let admin: SupabaseClient | null = null;
let adminInitError: string | null = null;

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local) to run the WEB-020 e2e.',
  );
  try {
    // Isolated in a try/catch (unlike WEB-014's beforeAll) so a broken
    // service-role client construction only skips the one test that needs
    // it, instead of failing the whole file — e.g. `@supabase/realtime-js`
    // throws "Node.js 20 detected without native WebSocket support" under
    // Node < 22 in this environment; the browser-driven tests don't need
    // this client at all.
    admin = createClient(SUPABASE_URL, SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (e) {
    adminInitError = e instanceof Error ? e.message : String(e);
  }
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: NAV_TIMEOUT });
}

test('dashboard loads with real KPIs and a GMV/signups trend chart', async ({ page }) => {
  await signIn(page);

  await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible({
    timeout: NAV_TIMEOUT,
  });

  // GMV KPI resolves to a real number once analyticsApi/financeApi respond
  // (the "…" loading placeholder is replaced).
  const gmvValue = page
    .locator('div.rounded-lg', { has: page.getByText('GMV — commandes payées', { exact: true }) })
    .first()
    .locator('p.text-h2')
    .first();
  await expect
    .poll(async () => (await gmvValue.innerText()).trim(), { timeout: NAV_TIMEOUT })
    .not.toMatch(/^(…|)$/);

  // The GMV/signups area chart (recharts SVG) renders in the "Volume de
  // transactions" section — this is DashboardGmvChart fed by
  // analyticsApi.marketplace().gmvTrend + analyticsApi.signupsTrend(), not the
  // fixture import that used to live inside the component.
  const gmvSection = page.locator('section', { has: page.getByText('Volume de transactions') });
  await expect(gmvSection.locator('.recharts-responsive-container').first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  // Two series (GMV + Inscriptions) — an area path per series.
  await expect(gmvSection.locator('.recharts-area-area')).toHaveCount(2, { timeout: NAV_TIMEOUT });
});

test('GMV trend reflects the live marketplace analytics endpoint, not a static fixture', async ({
  page,
  request,
}) => {
  await signIn(page);

  // The endpoint the chart is wired to (WEB-014 read model) responds and has
  // the real TrendPoint shape ({date, count} in cents), not the old fixture
  // shape ({date, value} in euros).
  const res = await request.get('/api/admin/analytics/marketplace', {
    headers: { cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join('; ') },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(Array.isArray(body.gmvTrend)).toBe(true);
  if (body.gmvTrend.length > 0) {
    expect(body.gmvTrend[0]).toHaveProperty('date');
    expect(body.gmvTrend[0]).toHaveProperty('count');
    expect(body.gmvTrend[0]).not.toHaveProperty('value'); // not the fixture's {date, value} shape
  }

  // Cross-check completedOrders/gmvCents against a service-role read of
  // `orders`, proving the summary reflects the DB rather than invented data.
  test.skip(!admin, `Service-role client unavailable in this environment: ${adminInitError}`);
  const { data: completed, error } = await admin!
    .from('orders')
    .select('amount_cents')
    .eq('status', 'COMPLETED');
  expect(error).toBeNull();
  const dbGmvCents = (completed ?? []).reduce((sum, o) => sum + (o.amount_cents ?? 0), 0);
  expect(body.gmvCents).toBe(dbGmvCents);
});

test('activity feed is visibly labeled as sample data', async ({ page }) => {
  await signIn(page);

  const activitySection = page.locator('section', { has: page.getByText('Activité récente') });
  await expect(activitySection).toBeVisible({ timeout: NAV_TIMEOUT });
  // No /admin/activity read model exists yet — the section must carry an
  // explicit "Exemple" pill so the feed can't be mistaken for live data.
  await expect(activitySection.getByText('Exemple', { exact: true })).toBeVisible();
  await expect(
    activitySection.getByText(/donn.es d.exemple/i),
  ).toBeVisible();
});

test('analytics route handlers backing the dashboard are staff-gated (unauth rejected)', async ({
  request,
}) => {
  const marketplaceRes = await request.get('/api/admin/analytics/marketplace');
  expect(marketplaceRes.status()).toBeGreaterThanOrEqual(401);
  expect(marketplaceRes.status()).toBeLessThan(404);

  const signupsRes = await request.get('/api/admin/analytics/users/signups-trend');
  expect(signupsRes.status()).toBeGreaterThanOrEqual(401);
  expect(signupsRes.status()).toBeLessThan(404);
});
