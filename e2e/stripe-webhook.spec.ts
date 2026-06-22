import { expect, test } from '@playwright/test';

// WEB-006 pattern — the Stripe webhook is the source of truth and must be:
//   1. rejected without a valid signature (401/400),
//   2. idempotent (replaying the same event id does not double-apply).
//
// It hits the server ROUTE HANDLER directly (service-role path), not the browser
// UI. This spec is a template: it is SKIPPED until WEB-006 ships the route. Set
// WEBHOOK_TEST_SECRET in the test env and remove `.skip` once the handler exists.
//
// Replace the path/payload with the real route + a real (test-signed) event.

const WEBHOOK_PATH = '/api/stripe/webhook';
const TEST_SECRET = process.env.WEBHOOK_TEST_SECRET ?? '';

test.describe('stripe webhook (WEB-006)', () => {
  test.skip(!TEST_SECRET, 'Set WEBHOOK_TEST_SECRET and implement the route (WEB-006) to enable.');

  test('rejects an unsigned webhook', async ({ request }) => {
    const res = await request.post(WEBHOOK_PATH, {
      data: { id: 'evt_test_unsigned', type: 'payment_intent.succeeded' },
    });
    expect([400, 401]).toContain(res.status());
  });

  test('applies a signed event once, idempotently on replay', async ({ request }) => {
    const headers = { 'x-webhook-test-secret': TEST_SECRET };
    const event = {
      id: 'evt_test_idem_001',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_001', metadata: { order_id: 'order_test_001' } } },
    };

    const first = await request.post(WEBHOOK_PATH, { headers, data: event });
    expect(first.ok()).toBeTruthy();

    // Replay the same event id — must be a no-op (already processed), not a
    // second state change. The handler should dedupe by Stripe event id.
    const replay = await request.post(WEBHOOK_PATH, { headers, data: event });
    expect(replay.ok()).toBeTruthy();
    // Assert the order reached SUCCEEDED exactly once via the read API/DB here
    // once WEB-005/006 expose order status. (Left for the WEB-006 build.)
  });
});
