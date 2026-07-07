/**
 * Orders repository — admin orders / finance / disputes / refunds (WEB-013).
 *
 * Owns ALL access to `orders` (+ the SCR-009 payment columns) for the admin
 * surface. Built with the SERVICE-ROLE client inside Route Handlers that have
 * already passed `gateStaff()` — staff need cross-user visibility across every
 * order, which RLS on `orders` (buyer/seller-only) deliberately withholds from
 * the browser. Never constructed on the client.
 *
 * No new tables: reads the WEB-005 `orders` rows and the WEB-006/SCR-009
 * payment columns (`payment_intent_id`, `payment_status`, `paid_at`). The Stripe
 * refund action calls the shared service-role path; the Stripe webhook remains
 * the source of truth that flips `payment_status` to REFUNDED.
 */
import type { Database } from '@/lib/database.types';
import type {
  AdminOrder,
  FinanceSummary,
  OrderFilters,
  OrderStatus,
  PageResponse,
} from '@/lib/api';

import { BaseRepository } from './base';

// `orders` (incl. the SCR-009 payment columns) is fully typed in the generated
// contract after `db:types`.
type OrderRow = Database['public']['Tables']['orders']['Row'];

const DEFAULT_SIZE = 25;
const MAX_SIZE = 100;

function mapOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    listingId: row.listing_id,
    listingTitleSnapshot: row.listing_title,
    listingThumbSnapshot: row.listing_thumb,
    listingType: row.listing_type,
    amountCents: row.amount_cents,
    feeCents: row.fee_cents,
    depositCents: row.deposit_cents,
    status: row.status,
    buyerConfirmed: row.buyer_confirmed,
    sellerConfirmed: row.seller_confirmed,
    paymentIntentId: row.payment_intent_id ?? null,
    paymentStatus: row.payment_status ?? null,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
  };
}

export class OrdersRepository extends BaseRepository {
  /** Server-side paginated, filtered list of every order (staff scope). */
  async list(filters: OrderFilters = {}): Promise<PageResponse<AdminOrder>> {
    const page = Math.max(0, Number(filters.page ?? 0));
    const size = Math.min(MAX_SIZE, Math.max(1, Number(filters.size ?? DEFAULT_SIZE)));
    const from = page * size;
    const to = from + size - 1;

    let query = this.db
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.buyerId) query = query.eq('buyer_id', filters.buyerId);
    if (filters.sellerId) query = query.eq('seller_id', filters.sellerId);

    const { data, error, count } = await query;
    if (error) throw new Error(`orders.list failed: ${error.message}`);

    const items = (data ?? []).map(mapOrder);
    const total = count ?? items.length;
    const totalPages = Math.max(1, Math.ceil(total / size));

    return {
      content: items,
      page,
      size,
      totalElements: total,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  }

  /** Single order by id. Returns null when it doesn't exist. */
  async get(id: string): Promise<AdminOrder | null> {
    const { data, error } = await this.db
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`orders.get failed: ${error.message}`);
    if (!data) return null;
    return mapOrder(data);
  }

  /**
   * Finance reconciliation summary — GMV, fees, and order counts by status.
   * Aggregated in the database via count-only queries rather than pulling every
   * row into the app (the old `financeApi.summary` client-side sum capped at 200).
   */
  async summary(): Promise<FinanceSummary> {
    // GMV + fees over COMPLETED orders. Sum in JS over the completed slice only
    // (Supabase has no SQL SUM in the JS client without an RPC); completed
    // orders are the bounded, reconciled set.
    const { data: completedRows, error: cErr } = await this.db
      .from('orders')
      .select('amount_cents, fee_cents')
      .eq('status', 'COMPLETED');
    if (cErr) throw new Error(`orders.summary failed: ${cErr.message}`);

    const totalGmvCents = (completedRows ?? []).reduce((a, o) => a + (o.amount_cents ?? 0), 0);
    const totalFeesCents = (completedRows ?? []).reduce((a, o) => a + (o.fee_cents ?? 0), 0);

    const countFor = async (statuses: OrderStatus[]): Promise<number> => {
      const { count, error } = await this.db
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', statuses);
      if (error) throw new Error(`orders.summary count failed: ${error.message}`);
      return count ?? 0;
    };

    const [completedOrders, pendingOrders, refundedOrders] = await Promise.all([
      countFor(['COMPLETED']),
      countFor(['AWAITING_PICKUP', 'HANDOFF_PENDING']),
      countFor(['REFUNDED']),
    ]);

    return {
      totalGmvCents,
      totalFeesCents,
      completedOrders,
      pendingOrders,
      refundedOrders,
    };
  }

  /**
   * Issue a Stripe refund for an order. Idempotent: a request id derived from
   * the order id prevents a double refund on retry. The webhook
   * (`charge.refunded`) is the source of truth that finally flips
   * `payment_status`/`status` to REFUNDED — this call only kicks off the refund.
   */
  async refund(id: string, amountCents?: number): Promise<AdminOrder> {
    const order = await this.get(id);
    if (!order) throw new Error(`NOT_FOUND: order ${id}`);
    if (!order.paymentIntentId) {
      throw new Error(`INVALID_STATUS: order ${id} has no payment to refund`);
    }
    if (order.status === 'REFUNDED') {
      // Already refunded — idempotent no-op, return current state.
      return order;
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      // Stripe unconfigured → 503-style, never a 500 (matches KYC/payments seam).
      throw new Error('STRIPE_UNCONFIGURED: refunds unavailable');
    }

    // Idempotency-Key ties the refund to the order so a retried request reuses
    // the same Stripe refund rather than creating a second one.
    const body = new URLSearchParams({ payment_intent: order.paymentIntentId });
    if (amountCents != null) body.set('amount', String(amountCents));

    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Idempotency-Key': `refund_${id}`,
      },
      body,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err?.error?.message ?? `Stripe refund failed (HTTP ${res.status})`;
      throw new Error(`REFUND_FAILED: ${message}`);
    }

    // Final REFUNDED state lands via the webhook; return the current order so the
    // UI can show "refund initiated" without pretending the flip already happened.
    return order;
  }
}
