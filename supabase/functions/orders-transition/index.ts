// orders-transition — server-enforced order state machine.
//
// POST { orderId, action: 'confirm-pickup' | 'cancel', reason? }
//   confirm-pickup — buyer AND seller each confirm the in-person handoff. When
//     both have confirmed, the order moves AWAITING_PICKUP/HANDOFF_PENDING →
//     COMPLETED. (mobile ordersApi.confirmPickup)
//   cancel — buyer or seller cancels an order that is not already terminal.
//     A captured Stripe order (payment SUCCEEDED / PARTIALLY_REFUNDED) can't be
//     plain-cancelled — it must go through the admin refund flow (409
//     payment_captured_use_refund). (mobile ordersApi.cancel)
//
// Auth: user JWT (must be the buyer or seller). Idempotency via `Idempotency-Key`.
//
// Invariants (mobile WEB-005 edge cases):
//   - confirm-pickup / cancel only by a party to the order (→ 403)
//   - cancel after COMPLETED / REFUNDED / CANCELLED is rejected (→ 409)
//   - re-confirming when you already confirmed is a no-op (idempotent)
//
// Allowed transition map (terminal states reject everything):
//   AWAITING_PICKUP  --confirm--> HANDOFF_PENDING --confirm--> COMPLETED
//   AWAITING_PICKUP / HANDOFF_PENDING  --cancel--> CANCELLED
import { corsHeaders, json } from '../_shared/cors.ts';
import {
  HttpError,
  idempotentReplay,
  requireUser,
  serviceClient,
} from '../_shared/supabase.ts';
import { scheduleBuyerRelease, releaseDueHold } from '../_shared/held-proceeds.ts';
import Stripe from 'npm:stripe@^22.3.0';

type Action = 'confirm-pickup' | 'cancel';
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'REFUNDED', 'DISPUTED']);
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const idemKey = req.headers.get('Idempotency-Key');

    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body.orderId;
    const action: Action | undefined = body.action;
    const reason: string | null = body.reason ?? null;
    if (!orderId || !action) throw new HttpError(400, 'orderId and action required');

    const idem = await idempotentReplay(svc, `orders.transition:${action}`, idemKey);
    if (idem.cached) return idem.cached;

    const { data: order, error } = await svc
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!order) throw new HttpError(404, 'order_not_found');

    const isBuyer = order.buyer_id === user.id;
    const isSeller = order.seller_id === user.id;
    if (!isBuyer && !isSeller) throw new HttpError(403, 'not_a_party');

    if (TERMINAL.has(order.status)) {
      throw new HttpError(409, `order_terminal:${order.status}`);
    }

    // A1 (WEB-017) — a Stripe order must be PAID before the in-person handoff can
    // be confirmed (otherwise it could reach COMPLETED unpaid). Orders with no
    // payment_intent_id are non-Stripe/cash and are not gated here.
    if (
      action === 'confirm-pickup' &&
      order.payment_intent_id &&
      order.payment_status !== 'SUCCEEDED'
    ) {
      throw new HttpError(409, 'payment_not_completed');
    }

    // A1 (WEB-017) — the flip side: a captured payment can't be unwound by a plain
    // cancel. With immediate capture + destination charges the funds are already at
    // the seller, so a status flip to CANCELLED would leave a captured-but-refundless
    // order. Block it and route through the admin refund flow (which reverses the
    // transfer + application fee). A fully REFUNDED order may still cancel — its
    // money is already back. Cash/non-Stripe orders are unaffected.
    if (
      action === 'cancel' &&
      order.payment_intent_id &&
      (order.payment_status === 'SUCCEEDED' ||
        order.payment_status === 'PARTIALLY_REFUNDED')
    ) {
      throw new HttpError(409, 'payment_captured_use_refund');
    }

    let result;
    if (action === 'confirm-pickup') {
      result = await confirmPickup(svc, order, user.id, isBuyer);
    } else {
      result = await cancel(svc, order, user.id, reason);
    }

    const response = toOrder(result);
    await idem.commit(response);
    return json(response, 200);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    return json({ error: 'internal_error' }, 500);
  }
});

async function confirmPickup(
  svc: ReturnType<typeof serviceClient>,
  order: Record<string, unknown>,
  uid: string,
  isBuyer: boolean,
) {
  const fromStatus = order.status as string;

  // Atomic confirmation (SCR-012): a single UPDATE flips only the caller's flag
  // and derives status, so two simultaneous confirmations can't lose one. The
  // RPC is service-role-only and guards party + non-terminal state itself.
  const { data, error } = await svc.rpc('confirm_order_pickup', {
    p_order_id: order.id as string,
    p_actor: uid,
  });
  if (error) throw new HttpError(500, error.message);
  const updated = (Array.isArray(data) ? data[0] : data) as
    | Record<string, unknown>
    | null;
  if (!updated) throw new HttpError(409, 'order_not_confirmable');

  const toStatus = updated.status as string;
  if (fromStatus !== toStatus) {
    await svc.from('order_events').insert({
      order_id: updated.id,
      actor_id: uid,
      from_status: fromStatus,
      to_status: toStatus,
      note: isBuyer ? 'buyer_confirmed_pickup' : 'seller_confirmed_pickup',
    });
  }

  // Only the authenticated buyer can authorise seller-release scheduling. A
  // seller confirmation still completes the fulfilment record, but never moves
  // money. Immediate (<€500) releases are attempted here; failed attempts stay
  // safely pending for the reconciler rather than undoing the buyer's receipt.
  if (isBuyer && order.payment_intent_id) {
    await scheduleBuyerRelease(svc, updated.id as string);
    if (STRIPE_SECRET_KEY) {
      const { data: hold } = await svc
        .from('held_seller_proceeds')
        .select('id, order_id, seller_id, stripe_charge_id, seller_net_cents, status, release_after')
        .eq('order_id', updated.id as string)
        .maybeSingle();
      if (hold) {
        try {
          const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', httpClient: Deno });
          await releaseDueHold(svc, stripe, hold);
        } catch (releaseError) {
          console.error('held proceeds release deferred', releaseError);
        }
      }
    }
  }
  return updated;
}

async function cancel(
  svc: ReturnType<typeof serviceClient>,
  order: Record<string, unknown>,
  uid: string,
  reason: string | null,
) {
  const fromStatus = order.status as string;
  const { data: updated, error } = await svc
    .from('orders')
    .update({
      status: 'CANCELLED',
      cancelled_by: uid,
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', order.id as string)
    .in('status', ['AWAITING_PICKUP', 'HANDOFF_PENDING'])
    .select('*')
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!updated) throw new HttpError(409, 'order_not_cancellable');

  await svc.from('order_events').insert({
    order_id: order.id,
    actor_id: uid,
    from_status: fromStatus,
    to_status: 'CANCELLED',
    note: reason ?? 'cancelled',
  });
  // A cancelled, unpaid offer checkout releases its reservation. The offer is
  // terminally withdrawn, allowing the seller to accept another pending offer.
  if (order.offer_id) {
    await svc
      .from('offers')
      .update({ status: 'WITHDRAWN', response_message: 'Paiement non finalisé.', responded_at: new Date().toISOString() })
      .eq('id', order.offer_id as string)
      .eq('order_id', order.id as string)
      .eq('status', 'ACCEPTED');
    await svc
      .from('listings')
      .update({ status: 'ACTIVE' })
      .eq('id', order.listing_id as string)
      .eq('status', 'SOLD');
  }
  return updated;
}

function toOrder(o: Record<string, unknown>) {
  return {
    id: o.id,
    buyerId: o.buyer_id,
    sellerId: o.seller_id,
    listingId: o.listing_id,
    listingTitle: o.listing_title,
    listingThumb: o.listing_thumb,
    listingType: o.listing_type,
    amountCents: o.amount_cents,
    feeCents: o.fee_cents,
    depositCents: o.deposit_cents,
    rentalStart: o.rental_start,
    rentalEnd: o.rental_end,
    status: o.status,
    buyerConfirmed: o.buyer_confirmed,
    sellerConfirmed: o.seller_confirmed,
    depositReleased: o.deposit_released,
    cancelledBy: o.cancelled_by,
    cancellationReason: o.cancellation_reason,
    createdAt: o.created_at,
    completedAt: o.completed_at,
    cancelledAt: o.cancelled_at,
  };
}
