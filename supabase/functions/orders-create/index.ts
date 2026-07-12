// orders-create — create an order from an accepted offer or a direct buy.
//
// POST { listingId, offerId?, rentalStart?, rentalEnd?, serviceHours? }
//   (mobile ordersApi.create)
// Auth: user JWT (the buyer).
//
// PRICING IS SERVER-AUTHORITATIVE (WEB-016): the client NEVER sends a total.
// The amount is recomputed here from the listing's own price + the params
// (rental dates / service hours), using the exact same formula the checkout
// screens display. A tampered client could otherwise create a 1-cent order for
// a 100€ listing (and pay only that, since payments-create-intent charges
// order.amount_cents). The offer path uses the agreed offer.amount_cents.
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

// Service fee: 5% of subtotal, with a 0.95€ floor on SALES only — this MUST
// match the mobile checkout screens' displayed total, or the PaymentSheet would
// charge a different amount than the user saw.
const FEE_RATE = 0.05;
const SALE_MIN_FEE_CENTS = 95;

type ListingPricing = {
  listing_type: string;
  price_cents: number | null;
  price_per_day_cents: number | null;
  deposit_cents: number | null;
  hourly_rate_cents: number | null;
  flat_rate_cents: number | null;
};

// Matches mobile `daysBetween` (src/shared/lib/availability); rental days = +1.
function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return 1;
  return Math.max(1, Math.round((e - s) / 86_400_000));
}

type Pricing = {
  amountCents: number;
  feeCents: number;
  depositCents: number;
  rentalStart: string | null;
  rentalEnd: string | null;
};

function computePricing(
  listing: ListingPricing,
  opts: { rentalStart: string | null; rentalEnd: string | null; serviceHours: number | null },
): Pricing {
  if (listing.listing_type === 'LOCATION') {
    if (!opts.rentalStart || !opts.rentalEnd) {
      throw new HttpError(400, 'rental_dates_required');
    }
    const days = daysBetween(opts.rentalStart, opts.rentalEnd) + 1;
    const subtotal = days * (listing.price_per_day_cents ?? 0);
    const fee = Math.round(subtotal * FEE_RATE);
    return {
      amountCents: subtotal + fee,
      feeCents: fee,
      depositCents: listing.deposit_cents ?? 0,
      rentalStart: opts.rentalStart,
      rentalEnd: opts.rentalEnd,
    };
  }
  if (listing.listing_type === 'SERVICE') {
    const hours = opts.serviceHours && opts.serviceHours > 0 ? opts.serviceHours : 1;
    // Truthy check mirrors the client: a 0/absent flat rate falls to hourly.
    const subtotal = listing.flat_rate_cents
      ? listing.flat_rate_cents
      : (listing.hourly_rate_cents ?? 0) * hours;
    const fee = Math.round(subtotal * FEE_RATE);
    return { amountCents: subtotal + fee, feeCents: fee, depositCents: 0, rentalStart: null, rentalEnd: null };
  }
  // VENTE (sale) — default. 5% fee with a 0.95€ floor.
  const item = listing.price_cents ?? 0;
  const fee = item > 0 ? Math.max(SALE_MIN_FEE_CENTS, Math.round(item * FEE_RATE)) : 0;
  return { amountCents: item + fee, feeCents: fee, depositCents: 0, rentalStart: null, rentalEnd: null };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const idemKey = req.headers.get('Idempotency-Key');

    const body = await req.json().catch(() => ({}));
    const listingId: string | undefined = body.listingId;
    const offerId: string | null = body.offerId ?? null;
    const rentalStart: string | null = body.rentalStart ?? null;
    const rentalEnd: string | null = body.rentalEnd ?? null;
    const serviceHours: number | null =
      typeof body.serviceHours === 'number' ? body.serviceHours : null;
    if (!listingId) throw new HttpError(400, 'listingId required');

    const idem = await idempotentReplay(svc, 'orders.create', idemKey);
    if (idem.cached) return idem.cached;

    // Resolve the listing (seller, type, snapshot, PRICING — server-authoritative).
    const { data: listing, error: lErr } = await svc
      .from('listings')
      .select(
        'id, owner_id, listing_type, title, price_cents, price_per_day_cents, ' +
          'deposit_cents, hourly_rate_cents, flat_rate_cents',
      )
      .eq('id', listingId)
      .maybeSingle();
    if (lErr) throw new HttpError(500, lErr.message);
    if (!listing) throw new HttpError(404, 'listing_not_found');
    if (listing.owner_id === user.id) throw new HttpError(409, 'cannot_buy_own_listing');

    let pricing: Pricing;
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
      // Offer path: the agreed offer amount is authoritative (no added fee).
      pricing = {
        amountCents: offer.amount_cents,
        feeCents: 0,
        depositCents: 0,
        rentalStart: null,
        rentalEnd: null,
      };
      resolvedOfferId = offer.id;
    } else {
      // Direct buy: recompute from listing pricing + params (never from client).
      pricing = computePricing(listing as ListingPricing, {
        rentalStart,
        rentalEnd,
        serviceHours,
      });
    }

    if (pricing.amountCents <= 0) throw new HttpError(400, 'listing_not_purchasable');

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
        amount_cents: pricing.amountCents,
        fee_cents: pricing.feeCents,
        deposit_cents: pricing.depositCents,
        rental_start: pricing.rentalStart,
        rental_end: pricing.rentalEnd,
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
