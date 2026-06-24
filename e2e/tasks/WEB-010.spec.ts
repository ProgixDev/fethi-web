import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';

// WEB-010 — Listing management + moderation queue (browser e2e, MANDATORY gate).
//
// Flow: seed a throwaway owner + profile + an ACTIVE listing, sign in as the real
// staff admin through the login form, load /listings (live data renders), then
// open the moderation queue and soft-hide (PAUSE) the listing inline — asserting
// the staff action round-trips: listings.status → PAUSED in the DB AND a
// `listing.pause` audit row (SCR-004) written by the service-role handler. Then
// restore it (→ ACTIVE) and assert again. A second test proves the route handler
// is staff-gated (unauthenticated mutation rejected, listing untouched).
//
// Service-role key from env (.env.local, gitignored) — NEVER hardcoded. Run:
//   npx playwright test e2e/tasks/WEB-010.spec.ts
// (if the dev-server port clashes with a parallel run, set E2E_PORT=3001).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

const stamp = Date.now();
const OWNER_EMAIL = `web010.owner.${stamp}@example.com`;
const LISTING_TITLE = `E2E Annonce ${stamp}`;

let admin: SupabaseClient;
let ownerId = '';
let listingId = '';

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local) to run the WEB-010 e2e.',
  );
  admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1) Throwaway owner auth user + profile.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: `Pw!${stamp}aA`,
    email_confirm: true,
  });
  if (createErr || !created?.user) throw new Error(`seed owner failed: ${createErr?.message}`);
  ownerId = created.user.id;

  const { error: profErr } = await admin.from('profiles').insert({
    id: ownerId,
    display_name: `E2E Owner ${stamp}`,
    neighborhood: `E2EQuartier${stamp}`,
    status: 'ACTIVE',
    kyc_status: 'UNVERIFIED',
  });
  if (profErr) throw new Error(`seed profile failed: ${profErr.message}`);

  // 2) An ACTIVE listing owned by the seeded user.
  const { data: listing, error: listErr } = await admin
    .from('listings')
    .insert({
      owner_id: ownerId,
      listing_type: 'VENTE',
      title: LISTING_TITLE,
      description: 'Annonce de test e2e WEB-010.',
      price_cents: 1500,
      neighborhood: `E2EQuartier${stamp}`,
      status: 'ACTIVE',
    })
    .select('id')
    .single();
  if (listErr || !listing) throw new Error(`seed listing failed: ${listErr?.message}`);
  listingId = listing.id;
});

test.afterAll(async () => {
  if (!admin) return;
  if (listingId) {
    await admin.from('staff_audit_log').delete().eq('target_id', listingId);
    await admin.from('listings').delete().eq('id', listingId);
  }
  if (ownerId) {
    await admin.from('profiles').delete().eq('id', ownerId);
    await admin.auth.admin.deleteUser(ownerId).catch(() => {});
  }
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test('staff sees the live listing, then soft-hide + restore round-trip', async ({ page }) => {
  await signIn(page);

  // Live data renders on the listings list.
  await page.goto('/listings');
  await page.getByPlaceholder(/Titre, description/i).fill(LISTING_TITLE);
  await expect(page.getByText(LISTING_TITLE, { exact: false }).first()).toBeVisible({
    timeout: 20_000,
  });

  // The queue surfaces DRAFT/PAUSED/ARCHIVED. An ACTIVE listing enters the queue
  // once it's soft-hidden, so first pause it from the detail screen (a staff
  // moderation action through the same handler), then restore it FROM the queue.
  await page.goto(`/listings/${listingId}`);
  await page.getByRole('button', { name: /Mettre en pause/i }).click();

  // DB round-trip: status → PAUSED.
  await expect
    .poll(async () => {
      const { data } = await admin
        .from('listings')
        .select('status')
        .eq('id', listingId)
        .single();
      return data?.status;
    }, { timeout: 20_000 })
    .toBe('PAUSED');

  // Audit round-trip: a listing.pause row exists.
  const { data: pauseAudit } = await admin
    .from('staff_audit_log')
    .select('action, target_type')
    .eq('target_id', listingId)
    .eq('action', 'listing.pause');
  expect(pauseAudit && pauseAudit.length).toBeGreaterThan(0);
  expect(pauseAudit?.[0]?.target_type).toBe('listing');

  // Now the PAUSED listing appears in the moderation queue → restore it inline.
  await page.goto('/listings/moderation?status=PAUSED');
  const row = page.getByTestId('queue-row').filter({ has: page.getByText(LISTING_TITLE) });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId('queue-restore').click();

  // DB round-trip: status → ACTIVE.
  await expect
    .poll(async () => {
      const { data } = await admin
        .from('listings')
        .select('status')
        .eq('id', listingId)
        .single();
      return data?.status;
    }, { timeout: 20_000 })
    .toBe('ACTIVE');

  const { data: restoreAudit } = await admin
    .from('staff_audit_log')
    .select('action')
    .eq('target_id', listingId)
    .eq('action', 'listing.restore');
  expect(restoreAudit && restoreAudit.length).toBeGreaterThan(0);
});

test('moderation route handler is staff-gated (unauth rejected)', async ({ request }) => {
  const res = await request.patch(`/api/admin/listings/${listingId}/status`, {
    data: { status: 'ARCHIVED' },
  });
  expect(res.status(), 'unauthenticated moderation must be denied').toBeGreaterThanOrEqual(401);
  expect(res.status()).toBeLessThan(404);

  const { data } = await admin
    .from('listings')
    .select('status')
    .eq('id', listingId)
    .single();
  expect(data?.status).not.toBe('ARCHIVED');
});
