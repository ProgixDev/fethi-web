// revenuecat-webhook — RevenueCat entitlement sync (IAP rail, SCR-011 / TASK-015).
//
// POST (RevenueCat → Edge Function)
// Auth: shared bearer token in the Authorization header, compared to the
//       REVENUECAT_WEBHOOK_AUTH Edge secret (RevenueCat sends whatever string
//       you configure in its dashboard). NO user JWT — verify_jwt=false.
// Idempotency: app_store_transactions is unique on (platform, transaction_id);
//       re-delivery is a no-op insert, and the app_entitlements upsert is
//       naturally idempotent (it writes the current state).
//
// Effect: records the transaction in app_store_transactions, then upserts the
// current app_entitlements state per (user_id, entitlement_key). The client
// NEVER writes these tables — a client "is plus" flag is a cache only.
//
// Events (https://www.revenuecat.com/docs/webhooks/event-types-and-fields):
//   INITIAL_PURCHASE | RENEWAL | UNCANCELLATION | PRODUCT_CHANGE |
//   NON_RENEWING_PURCHASE            → entitlement ACTIVE
//   CANCELLATION | BILLING_ISSUE     → still ACTIVE (until expiry / grace),
//                                      will_renew=false
//   EXPIRATION | REFUND | SUBSCRIPTION_PAUSED → entitlement REVOKED (inactive)
//   TRANSFER | SUBSCRIBER_ALIAS      → acknowledged, no entitlement change here
//
// Edge cases:
//   - Bad/missing token → 401, do not mutate
//   - Missing app_user_id → 400 (can't attribute)
//   - No entitlement ids on the event → record the txn, skip entitlement upsert
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

const REVENUECAT_WEBHOOK_AUTH = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');

// Event types that GRANT/keep the entitlement active vs. REVOKE it.
const ACTIVE_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
]);
const REVOKE_EVENTS = new Set(['EXPIRATION', 'REFUND', 'SUBSCRIPTION_PAUSED']);
// CANCELLATION / BILLING_ISSUE: entitlement stays active until it actually
// expires — the store keeps serving it; we only clear will_renew.
const KEEP_ACTIVE_NO_RENEW = new Set(['CANCELLATION', 'BILLING_ISSUE']);

function platformFromStore(store?: string): string {
  switch ((store ?? '').toUpperCase()) {
    case 'APP_STORE':
    case 'MAC_APP_STORE':
      return 'ios';
    case 'PLAY_STORE':
      return 'android';
    default:
      return (store ?? 'unknown').toLowerCase();
  }
}

function entitlementIds(ev: Record<string, unknown>): string[] {
  const many = ev.entitlement_ids;
  if (Array.isArray(many) && many.length) return many.map(String);
  const one = ev.entitlement_id;
  return typeof one === 'string' && one ? [one] : [];
}

function msToIso(ms: unknown): string | null {
  return typeof ms === 'number' && Number.isFinite(ms)
    ? new Date(ms).toISOString()
    : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Unconfigured → 503 (missing config, not a bug). Kept OUT of the try so it
  // can't be masked as a generic 500.
  if (!REVENUECAT_WEBHOOK_AUTH) {
    return json({ error: 'revenuecat_unconfigured' }, 503);
  }

  // Shared-secret auth. RevenueCat sends the exact Authorization header value
  // you configure; accept it with or without a leading "Bearer ".
  const auth = req.headers.get('Authorization') ?? '';
  const presented = auth.replace(/^Bearer\s+/i, '');
  if (presented !== REVENUECAT_WEBHOOK_AUTH && auth !== REVENUECAT_WEBHOOK_AUTH) {
    return json({ error: 'unauthorized' }, 401);
  }

  try {
    const payload = await req.json().catch(() => null);
    const ev = payload?.event as Record<string, unknown> | undefined;
    if (!ev || typeof ev !== 'object') {
      return json({ error: 'invalid_payload' }, 400);
    }

    const eventType = String(ev.type ?? '');
    const userId = (ev.app_user_id ?? ev.original_app_user_id) as string | undefined;
    if (!userId) {
      return json({ error: 'missing_app_user_id' }, 400);
    }

    const svc = serviceClient();
    const store = ev.store as string | undefined;
    const platform = platformFromStore(store);
    const transactionId =
      (ev.transaction_id as string | undefined) ??
      (ev.id as string | undefined) ??
      null;
    const productId = (ev.product_id as string | undefined) ?? null;
    const environment = (ev.environment as string | undefined) ?? null;
    const purchasedAt = msToIso(ev.purchased_at_ms);
    const expiresAt = msToIso(ev.expiration_at_ms);
    // Logical event time — drives the app_entitlements stale-event guard (a late
    // RENEWAL after a CANCELLATION must not clobber the newer state).
    const eventTs = msToIso(ev.event_timestamp_ms) ?? new Date().toISOString();
    const keys = entitlementIds(ev);

    // 1. Record the transaction (audit + idempotency). Dedup on
    //    (platform, transaction_id) — re-delivery is a no-op.
    if (transactionId) {
      const { error: txErr } = await svc
        .from('app_store_transactions')
        .upsert(
          {
            user_id: userId,
            platform,
            transaction_id: transactionId,
            product_id: productId,
            entitlement_key: keys[0] ?? null,
            event_type: eventType,
            environment,
            store: store ?? null,
            price_cents:
              typeof ev.price_in_purchased_currency === 'number'
                ? Math.round((ev.price_in_purchased_currency as number) * 100)
                : typeof ev.price === 'number'
                  ? Math.round((ev.price as number) * 100)
                  : null,
            currency: (ev.currency as string | undefined) ?? null,
            purchased_at: purchasedAt,
            expires_at: expiresAt,
            raw: payload as Record<string, unknown>,
          },
          { onConflict: 'platform,transaction_id', ignoreDuplicates: true },
        );
      if (txErr) console.error('app_store_transactions upsert failed:', txErr.message);
    }

    // 2. TRANSFER / SUBSCRIBER_ALIAS carry no entitlement decision for us here.
    if (eventType === 'TRANSFER' || eventType === 'SUBSCRIBER_ALIAS') {
      return json({ received: true, note: 'alias_or_transfer_ack' }, 200);
    }

    // 3. Upsert entitlement state per (user_id, entitlement_key).
    if (keys.length === 0) {
      return json({ received: true, note: 'no_entitlements_on_event' }, 200);
    }

    const isActive = ACTIVE_EVENTS.has(eventType) || KEEP_ACTIVE_NO_RENEW.has(eventType);
    const willRenew = ACTIVE_EVENTS.has(eventType)
      ? eventType !== 'NON_RENEWING_PURCHASE'
      : false;
    const revoked = REVOKE_EVENTS.has(eventType);
    const periodType = ((ev.period_type as string | undefined) ?? '').toLowerCase() || null;

    const rows = keys.map((key) => ({
      user_id: userId,
      entitlement_key: key,
      is_active: revoked ? false : isActive,
      product_id: productId,
      platform,
      store: store ?? null,
      period_type: periodType,
      will_renew: revoked ? false : willRenew,
      expires_at: expiresAt,
      latest_transaction_id: transactionId,
      event_ts: eventTs,
      updated_at: new Date().toISOString(),
    }));

    const { error: entErr } = await svc
      .from('app_entitlements')
      .upsert(rows, { onConflict: 'user_id,entitlement_key' });
    if (entErr) {
      console.error('app_entitlements upsert failed:', entErr.message);
      return json({ error: 'entitlement_write_failed' }, 500);
    }

    return json({ received: true, entitlements: keys, active: !revoked && isActive }, 200);
  } catch (err) {
    console.error('revenuecat-webhook error:', err);
    return json({ error: 'webhook_error' }, 500);
  }
});
