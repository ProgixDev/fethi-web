import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import ws from 'ws';

// Node 20 has no native WebSocket global that satisfies @supabase/realtime-js's
// constructor check, so createClient throws before Realtime is ever touched —
// see e2e/tasks/WEB-022.spec.ts for the full explanation. Same workaround here.
const REALTIME_OPTS = { realtime: { transport: ws as unknown as WebSocket } };

// WEB-023 — Pre-publish listing moderation gate (browser + contract e2e,
// MANDATORY gate). fethi-mobile issue #68.
//
// Flow: seed a throwaway owner + profile + a PENDING_REVIEW listing, then:
//  1. Contract check — the anon (publishable) key cannot see it (RLS
//     `listings_select_active`), the owner's own authenticated client can.
//  2. Contract check — the `guard_listing_status_transition` trigger blocks
//     the owner from self-approving via a direct client-side UPDATE (the
//     real security hole this SCR closes: `listings_update_own` RLS alone
//     has no restriction on the `status` value).
//  3. Browser flow — staff signs in, sees it in /listings/pending, approves
//     it (→ ACTIVE), and the DB round-trips: status ACTIVE, audited as
//     `listing.approve`, now visible to anon.
//  4. Reject flow — a second PENDING_REVIEW listing, rejected (→ ARCHIVED)
//     from the general moderation queue, audited as `listing.reject`.
//  5. Route handler is staff-gated (unauthenticated mutation rejected).
//
// Service-role key from env (.env.local, gitignored) — NEVER hardcoded. Run:
//   npx playwright test e2e/tasks/WEB-023.spec.ts

// Tests are order-dependent (RLS/guard checks assert PENDING_REVIEW before the
// approve test transitions it to ACTIVE) — same pattern as WEB-022.spec.ts.
test.describe.configure({ mode: 'serial', retries: 2 });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

const stamp = Date.now();
const OWNER_EMAIL = `web023.owner.${stamp}@example.com`;
const OWNER_PASSWORD = `Pw!${stamp}aA`;
const TITLE_APPROVE = `E2E En attente ${stamp}`;
const TITLE_REJECT = `E2E À rejeter ${stamp}`;

let admin: SupabaseClient;
let ownerId = '';
let approveListingId = '';
let rejectListingId = '';

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY || !ANON_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local) to run the WEB-023 e2e.',
  );
  admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
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

  // listings_pricing_by_type only exempts DRAFT — PENDING_REVIEW needs real
  // pricing for its type (VENTE → price_cents), same as ACTIVE.
  const base = {
    owner_id: ownerId,
    listing_type: 'VENTE' as const,
    description: 'Annonce de test e2e WEB-023.',
    price_cents: 1500,
    neighborhood: `E2EQuartier${stamp}`,
    status: 'PENDING_REVIEW' as const,
  };

  const { data: toApprove, error: approveErr } = await admin
    .from('listings')
    .insert({ ...base, title: TITLE_APPROVE })
    .select('id')
    .single();
  if (approveErr || !toApprove) throw new Error(`seed approve-listing failed: ${approveErr?.message}`);
  approveListingId = toApprove.id;

  const { data: toReject, error: rejectErr } = await admin
    .from('listings')
    .insert({ ...base, title: TITLE_REJECT })
    .select('id')
    .single();
  if (rejectErr || !toReject) throw new Error(`seed reject-listing failed: ${rejectErr?.message}`);
  rejectListingId = toReject.id;
});

test.afterAll(async () => {
  if (!admin) return;
  for (const id of [approveListingId, rejectListingId]) {
    if (!id) continue;
    await admin.from('staff_audit_log').delete().eq('target_id', id);
    await admin.from('listings').delete().eq('id', id);
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

test('RLS: a PENDING_REVIEW listing is invisible to anon, visible to its owner', async () => {
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });
  const { data: anonRows, error: anonErr } = await anon
    .from('listings')
    .select('id')
    .eq('id', approveListingId);
  expect(anonErr).toBeNull();
  expect(anonRows ?? []).toHaveLength(0);

  const owner = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });
  const { error: signInErr } = await owner.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (signInErr) throw new Error(`owner sign-in failed: ${signInErr.message}`);

  const { data: ownRows, error: ownErr } = await owner
    .from('listings')
    .select('id, status')
    .eq('id', approveListingId);
  expect(ownErr).toBeNull();
  expect(ownRows?.[0]?.status).toBe('PENDING_REVIEW');

  await owner.auth.signOut();
});

test('DB guard: the owner cannot self-approve via a direct client update', async () => {
  const owner = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });
  const { error: signInErr } = await owner.auth.signInWithPassword({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
  });
  if (signInErr) throw new Error(`owner sign-in failed: ${signInErr.message}`);

  const { error: selfApproveErr } = await owner
    .from('listings')
    .update({ status: 'ACTIVE' })
    .eq('id', approveListingId);
  expect(
    selfApproveErr,
    'guard_listing_status_transition must reject an owner self-approving PENDING_REVIEW → ACTIVE',
  ).not.toBeNull();

  const { data: stillPending } = await admin
    .from('listings')
    .select('status')
    .eq('id', approveListingId)
    .single();
  expect(stillPending?.status).toBe('PENDING_REVIEW');

  await owner.auth.signOut();
});

test('staff sees the pending queue, approves a listing, and it becomes publicly visible', async ({
  page,
}) => {
  await signIn(page);

  await page.goto('/listings/pending');
  const row = page.getByTestId('pending-row').filter({ has: page.getByText(TITLE_APPROVE) });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId('pending-approve').click();

  await expect
    .poll(async () => {
      const { data } = await admin
        .from('listings')
        .select('status')
        .eq('id', approveListingId)
        .single();
      return data?.status;
    }, { timeout: 20_000 })
    .toBe('ACTIVE');

  const { data: approveAudit } = await admin
    .from('staff_audit_log')
    .select('action, target_type')
    .eq('target_id', approveListingId)
    .eq('action', 'listing.approve');
  expect(approveAudit && approveAudit.length).toBeGreaterThan(0);
  expect(approveAudit?.[0]?.target_type).toBe('listing');

  // Now publicly visible per listings_select_active.
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });
  const { data: anonRows } = await anon.from('listings').select('id').eq('id', approveListingId);
  expect(anonRows ?? []).toHaveLength(1);
});

test('staff rejects a listing from the general moderation queue', async ({ page }) => {
  await signIn(page);

  await page.goto('/listings/moderation?status=PENDING_REVIEW');
  const row = page.getByTestId('queue-row').filter({ has: page.getByText(TITLE_REJECT) });
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.getByTestId('queue-reject').click();

  await expect
    .poll(async () => {
      const { data } = await admin
        .from('listings')
        .select('status')
        .eq('id', rejectListingId)
        .single();
      return data?.status;
    }, { timeout: 20_000 })
    .toBe('ARCHIVED');

  const { data: rejectAudit } = await admin
    .from('staff_audit_log')
    .select('action')
    .eq('target_id', rejectListingId)
    .eq('action', 'listing.reject');
  expect(rejectAudit && rejectAudit.length).toBeGreaterThan(0);
});

test('listing status route handler is staff-gated (unauth rejected)', async ({ request }) => {
  const res = await request.patch(`/api/admin/listings/${rejectListingId}/status`, {
    data: { status: 'ACTIVE' },
  });
  expect(res.status(), 'unauthenticated moderation must be denied').toBeGreaterThanOrEqual(401);
  expect(res.status()).toBeLessThan(404);

  const { data } = await admin
    .from('listings')
    .select('status')
    .eq('id', rejectListingId)
    .single();
  expect(data?.status).not.toBe('ACTIVE');
});
