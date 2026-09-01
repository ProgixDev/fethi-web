import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect, test } from '@playwright/test';
import ws from 'ws';

// Node 20 (this repo's local + CI runtime, per .github/workflows) has no
// native WebSocket global that satisfies @supabase/realtime-js's constructor
// check, so createClient throws before we ever touch Realtime — this affects
// every `createClient` call across the e2e suite (confirmed: WEB-011.spec.ts
// fails the same way as of this task), not just this file. Passing the `ws`
// package (added as a devDependency by this task) as the transport sidesteps
// it. Worth a follow-up to fix this at the playwright/env level so every spec
// benefits, not just the ones that happen to set this option.
const REALTIME_OPTS = { realtime: { transport: ws as unknown as WebSocket } };

// WEB-022 — Support inbox (browser e2e, MANDATORY gate).
//
// Flow: seed a throwaway requester profile + an OPEN support ticket with a
// first USER message (SCR-028), sign in as the real staff admin, load
// /communications/support (live queue renders the ticket), open its detail,
// reply, and change status — asserting the staff round-trip: a STAFF message
// lands in support_ticket_messages AND the sync_ticket_on_message trigger
// updates the parent ticket's last_message/status. A second test proves the
// status route handler is staff-gated (unauth mutation rejected). A third
// test is the contract e2e: a different authenticated (non-staff) user's
// anon-key client cannot SELECT/INSERT another user's ticket (RLS).
//
// Service-role key from env (.env.local, gitignored) — NEVER hardcoded. Run:
//   npx playwright test e2e/tasks/WEB-022.spec.ts
test.describe.configure({ mode: 'serial', retries: 2 });

const NAV_TIMEOUT = 30_000;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const ADMIN_EMAIL = 'admin@mystreet.com';
const ADMIN_PASSWORD = 'Mystreet123';

const stamp = Date.now();
const REQUESTER_EMAIL = `web022.requester.${stamp}@example.com`;
const REQUESTER_PASSWORD = `Pw!${stamp}aA`;
const OTHER_EMAIL = `web022.other.${stamp}@example.com`;
const OTHER_PASSWORD = `Pw!${stamp}bB`;
const SUBJECT = `E2E support request ${stamp}`;

let admin: SupabaseClient;
let requesterId = '';
let otherId = '';
let ticketId = '';

test.beforeAll(async () => {
  test.skip(
    !SUPABASE_URL || !SECRET_KEY || !ANON_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local) to run the WEB-022 e2e.',
  );
  admin = createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });

  // 1) Throwaway requester auth user + profile.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: REQUESTER_EMAIL,
    password: REQUESTER_PASSWORD,
    email_confirm: true,
  });
  if (createErr || !created?.user) throw new Error(`seed requester failed: ${createErr?.message}`);
  requesterId = created.user.id;

  const { error: profErr } = await admin.from('profiles').insert({
    id: requesterId,
    display_name: `E2E Requester ${stamp}`,
    neighborhood: `E2EQuartier${stamp}`,
    status: 'ACTIVE',
    kyc_status: 'UNVERIFIED',
  });
  if (profErr) throw new Error(`seed profile failed: ${profErr.message}`);

  // 2) A second, unrelated user — used to prove RLS denies cross-user access.
  const { data: createdOther, error: otherErr } = await admin.auth.admin.createUser({
    email: OTHER_EMAIL,
    password: OTHER_PASSWORD,
    email_confirm: true,
  });
  if (otherErr || !createdOther?.user) throw new Error(`seed other user failed: ${otherErr?.message}`);
  otherId = createdOther.user.id;
  const { error: otherProfErr } = await admin.from('profiles').insert({
    id: otherId,
    display_name: `E2E Other ${stamp}`,
    neighborhood: `E2EQuartier${stamp}`,
    status: 'ACTIVE',
    kyc_status: 'UNVERIFIED',
  });
  if (otherProfErr) throw new Error(`seed other profile failed: ${otherProfErr.message}`);

  // 3) An OPEN ticket with its first USER message (mirrors how the mobile
  // support screen opens a ticket — see docs/MOBILE-SYNC-NOTES.md SCR-028).
  const { data: ticket, error: ticketErr } = await admin
    .from('support_tickets')
    .insert({ user_id: requesterId, subject: SUBJECT, status: 'OPEN' })
    .select('id')
    .single();
  if (ticketErr || !ticket) throw new Error(`seed ticket failed: ${ticketErr?.message}`);
  ticketId = ticket.id;

  const { error: msgErr } = await admin.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: requesterId,
    sender_role: 'USER',
    body: `Message initial e2e ${stamp}`,
  });
  if (msgErr) throw new Error(`seed first message failed: ${msgErr.message}`);
});

test.afterAll(async () => {
  if (!admin) return;
  if (ticketId) {
    await admin.from('support_ticket_messages').delete().eq('ticket_id', ticketId);
    await admin.from('support_tickets').delete().eq('id', ticketId);
  }
  if (requesterId) {
    await admin.from('profiles').delete().eq('id', requesterId);
    await admin.auth.admin.deleteUser(requesterId).catch(() => {});
  }
  if (otherId) {
    await admin.from('profiles').delete().eq('id', otherId);
    await admin.auth.admin.deleteUser(otherId).catch(() => {});
  }
});

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByPlaceholder('vous@mystreet.fr').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••••').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /Se connecter/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test('staff sees the live support queue, replies, and changes status', async ({ page }) => {
  await signIn(page);

  // Live data renders in the support inbox.
  await page.goto('/communications/support');
  await expect(page.getByText(SUBJECT, { exact: false }).first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });

  // Open the detail and reply.
  await page.goto(`/communications/support/${ticketId}`);
  await expect(page.getByText(SUBJECT, { exact: false }).first()).toBeVisible({
    timeout: NAV_TIMEOUT,
  });
  const replyBody = `Réponse staff e2e ${stamp}`;
  await page.getByPlaceholder(/Répondre à cette demande/i).fill(replyBody);
  await page.getByRole('button', { name: /Envoyer/i }).click();

  // DB round-trip: STAFF message inserted, trigger updates last_message.
  await expect
    .poll(
      async () => {
        const { data } = await admin
          .from('support_tickets')
          .select('last_message, last_sender_role')
          .eq('id', ticketId)
          .single();
        return data?.last_message;
      },
      { timeout: 20_000 },
    )
    .toBe(replyBody);

  const { data: afterReply } = await admin
    .from('support_tickets')
    .select('last_sender_role, unread_by_user')
    .eq('id', ticketId)
    .single();
  expect(afterReply?.last_sender_role).toBe('STAFF');
  expect(afterReply?.unread_by_user).toBeGreaterThan(0);

  // Status transition.
  await page.getByRole('button', { name: /^Résolu$/i }).click();
  await expect
    .poll(
      async () => {
        const { data } = await admin
          .from('support_tickets')
          .select('status')
          .eq('id', ticketId)
          .single();
        return data?.status;
      },
      { timeout: 20_000 },
    )
    .toBe('RESOLVED');
});

test('support status route handler is staff-gated (unauth rejected)', async ({ request }) => {
  const res = await request.patch(`/api/admin/support/${ticketId}/status`, {
    data: { status: 'CLOSED' },
  });
  expect(res.status(), 'unauthenticated support mutation must be denied').toBeGreaterThanOrEqual(
    401,
  );
  expect(res.status()).toBeLessThan(404);

  const { data } = await admin
    .from('support_tickets')
    .select('status')
    .eq('id', ticketId)
    .single();
  expect(data?.status).not.toBe('CLOSED');
});

test('RLS: a non-staff user cannot read or write another user\'s ticket', async () => {
  const other = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    ...REALTIME_OPTS,
  });
  const { error: signInErr } = await other.auth.signInWithPassword({
    email: OTHER_EMAIL,
    password: OTHER_PASSWORD,
  });
  if (signInErr) throw new Error(`other-user sign-in failed: ${signInErr.message}`);

  const { data: selected, error: selectErr } = await other
    .from('support_tickets')
    .select('id')
    .eq('id', ticketId);
  expect(selectErr).toBeNull();
  expect(selected ?? []).toHaveLength(0);

  const { error: insertErr } = await other.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_id: otherId,
    sender_role: 'USER',
    body: 'Tentative non autorisée',
  });
  expect(insertErr).not.toBeNull();

  await other.auth.signOut();
});
