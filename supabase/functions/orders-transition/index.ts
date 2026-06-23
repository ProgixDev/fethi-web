// orders-transition — server-enforced order state machine.
//
// POST { orderId, action: 'confirm-pickup' | 'cancel', reason? }
//   confirm-pickup — buyer AND seller each confirm the in-person handoff. When
//     both have confirmed, the order moves AWAITING_PICKUP/HANDOFF_PENDING →
//     COMPLETED. (mobile ordersApi.confirmPickup)
//   cancel — buyer or seller cancels an order that is not already terminal.
//     (mobile ordersApi.cancel)
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

type Action = 'confirm-pickup' | 'cancel';
const TERMINAL = new Set(['COMPLETED', 'CANCELLED', 'REFUNDED']);

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
  const buyerConfirmed = isBuyer ? true : Boolean(order.buyer_confirmed);
  const sellerConfirmed = !isBuyer ? true : Boolean(order.seller_confirmed);
  const bothConfirmed = buyerConfirmed && sellerConfirmed;

  const fromStatus = order.status as string;
  // First confirmation moves AWAITING_PICKUP → HANDOFF_PENDING; second → COMPLETED.
  const toStatus = bothConfirmed ? 'COMPLETED' : 'HANDOFF_PENDING';

  const patch: Record<string, unknown> = {
    buyer_confirmed: buyerConfirmed,
    seller_confirmed: sellerConfirmed,
    status: toStatus,
  };
  if (bothConfirmed) patch.completed_at = new Date().toISOString();

  const { data: updated, error } = await svc
    .from('orders')
    .update(patch)
    .eq('id', order.id as string)
    .in('status', ['AWAITING_PICKUP', 'HANDOFF_PENDING'])
    .select('*')
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!updated) throw new HttpError(409, 'order_not_confirmable');

  if (fromStatus !== toStatus) {
    await svc.from('order_events').insert({
      order_id: order.id,
      actor_id: uid,
      from_status: fromStatus,
      to_status: toStatus,
      note: isBuyer ? 'buyer_confirmed_pickup' : 'seller_confirmed_pickup',
    });
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
