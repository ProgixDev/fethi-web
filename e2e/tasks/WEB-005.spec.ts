import { expect, test } from '@playwright/test';

// WEB-005 / SCR-003 — Contract e2e (mandatory; non-UI schema task).
//
// Asserts the RLS + contract surface of the messaging/offers/orders schema against
// the LIVE DB using the **anon publishable key** (no session). A non-participant /
// anon caller must read NOTHING from any participant-scoped table — no row leaks —
// while the tables/enums themselves exist (proven by a 200 + empty array, not a
// 404/4xx-schema error).
//
// Run: npm run test:e2e e2e/tasks/WEB-005.spec.ts
// (admin/order state assertions that need a real session/Edge deploy are covered by
//  the Edge Function invariants + the Management-API verification in the PR.)

// Read the project URL + anon PUBLISHABLE key from the same env vars the app uses
// (`.env.local`, gitignored). The publishable key is the client-side anon key —
// RLS is the security boundary — but we keep it out of source so the secret sweep
// stays clean and the spec is portable across environments.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };

test.beforeAll(() => {
  test.skip(
    !SUPABASE_URL || !ANON_KEY,
    'Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local) to run the contract e2e.',
  );
});

const PARTICIPANT_TABLES = [
  'threads',
  'messages',
  'message_attachments',
  'offers',
  'orders',
  'order_events',
];

test.describe('SCR-003 contract — participant-scoped RLS (anon sees nothing)', () => {
  for (const table of PARTICIPANT_TABLES) {
    test(`anon GET /${table} exists and leaks no rows`, async ({ request }) => {
      const res = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=5`, {
        headers,
      });
      // 200 proves the table + RLS policy exist (a missing table → 404/relation error).
      expect(res.status(), `GET ${table} should be 200 (table exists, RLS allows the query shape)`).toBe(200);
      const rows = await res.json();
      // RLS: anon is no one's participant → zero rows leak.
      expect(Array.isArray(rows)).toBeTruthy();
      expect(rows, `${table} must leak no rows to anon`).toHaveLength(0);
    });
  }

  test('idempotency_keys is invisible to anon (service-role only)', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/rest/v1/idempotency_keys?select=key&limit=5`, {
      headers,
    });
    // RLS enabled with NO policy → either 200 empty or a permission error; never rows.
    if (res.status() === 200) {
      const rows = await res.json();
      expect(rows).toHaveLength(0);
    } else {
      expect(res.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('anon cannot INSERT a message (no participant write path)', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/rest/v1/messages`, {
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      data: {
        thread_id: '00000000-0000-0000-0000-000000000000',
        sender_id: '00000000-0000-0000-0000-000000000000',
        kind: 'TEXT',
        text: 'should be blocked',
      },
    });
    // RLS denies the insert for anon (no policy grants it) → 401/403/4xx, never 201.
    expect(res.status(), 'anon message insert must be rejected by RLS').toBeGreaterThanOrEqual(400);
  });
});
