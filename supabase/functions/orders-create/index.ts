// orders-create — create an order from an accepted offer or a direct buy.
//
// POST { listingId, amountCentsOverride?, offerId? }   (mobile ordersApi.create)
// Auth: user JWT (the buyer).
// Idempotency: `Idempotency-Key` header REQUIRED in practice — a retry must not
//   create a second order. The first call's order is cached and replayed.
//
// Invariants (mobile WEB-005 edge cases):
//   - buyer cannot buy their own listing (→ 409)
//   - if offerId given, the offer must be ACCEPTED, belong to this buyer/listing,
//     and not have produced an order already (→ 409)
//   - duplicate order from a retry is deduped by Idempotency-Key
//
// Order is created as SERVICE ROLE (orders has no client write policy). The
// initial status is AWAITING_PICKUP and an order_events row records the creation.
import { corsHeaders, json } from '../_shared/cors.ts';
import {
  HttpError,
  idempotentReplay,
  requireUser,
  serviceClient,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const idemKey = req.headers.get('Idempotency-Key');

    const body = await req.json().catch(() => ({}));
    const listingId: string | undefined = body.listingId;
    const amountOverride: number | null = body.amountCentsOverride ?? null;
    const offerId: string | null = body.offerId ?? null;
    if (!listingId) throw new HttpError(400, 'listingId required');

    const idem = await idempotentReplay(svc, 'orders.create', idemKey);
    if (idem.cached) return idem.cached;

    // Resolve the listing (seller, type, snapshot).
    const { data: listing, error: lErr } = await svc
      .from('listings')
      .select('id, owner_id, listing_type, title, price_cents')
      .eq('id', listingId)
      .maybeSingle();
    if (lErr) throw new HttpError(500, lErr.message);
    if (!listing) throw new HttpError(404, 'listing_not_found');
    if (listing.owner_id === user.id) throw new HttpError(409, 'cannot_buy_own_listing');

    let amountCents = amountOverride ?? listing.price_cents ?? 0;
    let resolvedOfferId: string | null = null;

    if (offerId) {
      const { data: offer, error: oErr } = await svc
        .from('offers')
        .select('*')
        .eq('id', offerId)
        .maybeSingle();
      if (oErr) throw new HttpError(500, oErr.message);
      if (!offer) throw new HttpError(404, 'offer_not_found');
      if (offer.buyer_id !== user.id) throw new HttpError(403, 'offer_not_yours');
      if (offer.listing_id !== listingId) throw new HttpError(409, 'offer_listing_mismatch');
      if (offer.status !== 'ACCEPTED') throw new HttpError(409, `offer_not_accepted:${offer.status}`);
      if (offer.order_id) throw new HttpError(409, 'offer_already_ordered');
      amountCents = offer.amount_cents;
      resolvedOfferId = offer.id;
    }

    // First photo (thumb), best-effort.
    const { data: photo } = await svc
      .from('listing_photos')
      .select('storage_path')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: order, error: insErr } = await svc
      .from('orders')
      .insert({
        buyer_id: user.id,
        seller_id: listing.owner_id,
        listing_id: listingId,
        listing_title: listing.title,
        listing_thumb: photo?.storage_path ?? null,
        listing_type: listing.listing_type,
        amount_cents: amountCents,
        status: 'AWAITING_PICKUP',
        offer_id: resolvedOfferId,
      })
      .select('*')
      .single();
    if (insErr) throw new HttpError(500, insErr.message);

    await svc.from('order_events').insert({
      order_id: order.id,
      actor_id: user.id,
      from_status: null,
      to_status: 'AWAITING_PICKUP',
      note: resolvedOfferId ? 'created_from_offer' : 'created_direct',
    });

    if (resolvedOfferId) {
      await svc.from('offers').update({ order_id: order.id }).eq('id', resolvedOfferId);
    }

    const response = toOrder(order);
    await idem.commit(response);
    return json(response, 201);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    return json({ error: 'internal_error' }, 500);
  }
});

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
