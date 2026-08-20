/**
 * Billing repository (admin) — RevenueCat IAP entitlements & transactions
 * (SCR-011 / TASK-015: `app_entitlements`, `app_store_transactions`). MyStreet+
 * and boosts are digital goods sold via App Store/Play Billing through
 * RevenueCat, not Stripe (see docs/setup/revenuecat-iap.md).
 *
 * Service-role ONLY: `app_entitlements` has own-row read RLS and
 * `app_store_transactions` is service-role-write-only — a cross-user summary
 * must run through the service-role client inside an admin Route Handler
 * (after `gateStaff()`). Read-only.
 *
 * NOTE: the RevenueCat webhook is currently unconfigured (no
 * `REVENUECAT_WEBHOOK_AUTH` secret set) per the setup doc, so these are real
 * queries over real (currently empty) tables — they will read zero until the
 * IAP rail goes live, which is correct: it beats a fabricated MRR figure.
 */
import type { BillingSummary, EntitlementSummary, IapTransaction } from '@/lib/api';

import { BaseRepository } from './base';

const ENTITLEMENT_KEYS = ['plus', 'custom_radius', 'boost'];
const RECENT_LIMIT = 20;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class BillingRepository extends BaseRepository {
  async summary(): Promise<BillingSummary> {
    const since = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();

    const [entRes, txRes, recentRes] = await Promise.all([
      this.db.from('app_entitlements').select('entitlement_key').eq('is_active', true),
      this.db
        .from('app_store_transactions')
        .select('price_cents, currency, purchased_at')
        .gte('purchased_at', since),
      this.db
        .from('app_store_transactions')
        .select(
          'id, user_id, product_id, entitlement_key, event_type, price_cents, currency, platform, purchased_at',
        )
        .order('purchased_at', { ascending: false, nullsFirst: false })
        .limit(RECENT_LIMIT),
    ]);
    if (entRes.error) throw new Error(`billing.summary entitlements failed: ${entRes.error.message}`);
    if (txRes.error) throw new Error(`billing.summary transactions failed: ${txRes.error.message}`);
    if (recentRes.error) throw new Error(`billing.summary recent failed: ${recentRes.error.message}`);

    const counts = new Map<string, number>();
    for (const r of entRes.data ?? []) {
      counts.set(r.entitlement_key, (counts.get(r.entitlement_key) ?? 0) + 1);
    }
    const entitlements: EntitlementSummary[] = ENTITLEMENT_KEYS.map((key) => ({
      key,
      activeCount: counts.get(key) ?? 0,
    }));

    const revenueCentsLast30Days = (txRes.data ?? []).reduce((a, r) => a + (r.price_cents ?? 0), 0);

    const recent: IapTransaction[] = (recentRes.data ?? []).map((r) => ({
      id: r.id,
      userId: r.user_id,
      productId: r.product_id,
      entitlementKey: r.entitlement_key,
      eventType: r.event_type,
      priceCents: r.price_cents,
      currency: r.currency,
      platform: r.platform,
      purchasedAt: r.purchased_at,
    }));

    return {
      entitlements,
      revenueCentsLast30Days,
      transactionsLast30Days: (txRes.data ?? []).length,
      recent,
    };
  }
}
