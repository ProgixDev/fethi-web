// orders-create — create an order from an accepted offer or a direct buy.
//
// POST { listingId, offerId?, rentalStart?, rentalEnd?, serviceHours?, paymentMethod? }
//   (mobile ordersApi.create)
// Auth: user JWT (the buyer).
//
// PRICING IS SERVER-AUTHORITATIVE (WEB-016): the client NEVER sends a total.
// The amount is recomputed here from the listing's own price + the params
// (rental dates / service hours), using the same shared pricing module as the
// authenticated quote endpoint. A tampered client could otherwise create a 1-cent order for
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
//
// paymentMethod: 'card' (default) | 'handoff' — issue #36. A handoff order is
// never charged (mobile skips payments-create-intent entirely: payment_intent_id/
// payment_status stay null, which orders-transition already treats as the
// non-Stripe/cash case — see its WEB-017 comment). It does NOT get a different
// initial status: HANDOFF_PENDING is confirm_order_pickup's own mid-confirm
// state (one party confirmed, waiting on the other), not a payment-method flag,
// so both paths start at AWAITING_PICKUP.
// Since no money moves through the platform for a handoff, order.amount_cents
// is the raw listing price and order.fee_cents is 0 (nothing is collected at
// order time). The identical #30 seller fee is NOT waived: it's
// recorded as a seller_fee_receivables row (SCR-019 / ADR-0003) to be
// deducted from that seller's first real Stripe Connect payout once #35
// ships — see recordHandoffFeeReceivable below. Restricted to VENTE listings,
// matching #30's shipped scope.
// A handoff order also opens (or reuses) the buyer/seller thread for this
// listing and posts one automatic SYSTEM message, verbatim text from #36. This
// runs inside the same idempotent call as the order insert, so a retried
// request replays the cached response and never double-posts the message.
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  calculatePricing,
  type ListingPricing,
  type PricingBreakdown,
  PricingError,
} from "../_shared/pricing.ts";
import {
  HttpError,
  idempotentReplay,
  requireUser,
  serviceClient,
} from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const idemKey = req.headers.get("Idempotency-Key");

    const body = await req.json().catch(() => ({}));
    const listingId: string | undefined = body.listingId;
    const offerId: string | null = body.offerId ?? null;
    const rentalStart: string | null = body.rentalStart ?? null;
    const rentalEnd: string | null = body.rentalEnd ?? null;
    const serviceHours: number | null =
      typeof body.serviceHours === "number" ? body.serviceHours : null;
    const paymentMethod: "card" | "handoff" =
      body.paymentMethod === "handoff" ? "handoff" : "card";
    const quoteFingerprint: string | null =
      typeof body.quoteFingerprint === "string" ? body.quoteFingerprint : null;
    if (!listingId) throw new HttpError(400, "listingId required");

    const idem = await idempotentReplay(svc, "orders.create", idemKey);
    if (idem.cached) return idem.cached;

    // Resolve the listing (seller, type, snapshot, PRICING — server-authoritative).
    const { data: listing, error: lErr } = await svc
      .from("listings")
      .select(
        "id, owner_id, status, listing_type, title, price_cents, price_per_day_cents, " +
          "deposit_cents, hourly_rate_cents, flat_rate_cents",
      )
      .eq("id", listingId)
      .maybeSingle();
    if (lErr) throw new HttpError(500, lErr.message);
    if (!listing) throw new HttpError(404, "listing_not_found");
    if (listing.owner_id === user.id)
      throw new HttpError(409, "cannot_buy_own_listing");
    if (paymentMethod === "handoff" && listing.listing_type !== "VENTE") {
      throw new HttpError(400, "handoff_unsupported_for_listing_type");
    }
    if (!offerId && listing.status !== "ACTIVE") {
      throw new HttpError(409, "listing_not_available");
    }

    let pricing: PricingBreakdown;
    let resolvedOfferId: string | null = null;

    if (offerId) {
      const { data: offer, error: oErr } = await svc
        .from("offers")
        .select("*")
        .eq("id", offerId)
        .maybeSingle();
      if (oErr) throw new HttpError(500, oErr.message);
      if (!offer) throw new HttpError(404, "offer_not_found");
      if (offer.buyer_id !== user.id)
        throw new HttpError(403, "offer_not_yours");
      if (offer.listing_id !== listingId)
        throw new HttpError(409, "offer_listing_mismatch");
      if (offer.status !== "ACCEPTED")
        throw new HttpError(409, `offer_not_accepted:${offer.status}`);
      if (offer.order_id) throw new HttpError(409, "offer_already_ordered");
      // Offer path: the agreed amount replaces the listing price, while the
      // same seller-side commission still applies.
      pricing = calculatePricing(listing as ListingPricing, {
        paymentMethod,
        rentalStart: null,
        rentalEnd: null,
        serviceHours: null,
        agreedItemCents: offer.amount_cents,
        agreementKey: offer.id,
      });
      resolvedOfferId = offer.id;
    } else {
      // Direct buy: recompute from listing pricing + params (never from client).
      pricing = calculatePricing(listing as ListingPricing, {
        paymentMethod,
        rentalStart,
        rentalEnd,
        serviceHours,
        agreementKey: null,
      });
    }

    // The fingerprint is never trusted as pricing input: all values above were
    // recomputed from current server data. It only prevents confirmation of a
    // quote that became stale after the Member saw it.
    if (quoteFingerprint && quoteFingerprint !== pricing.pricingFingerprint) {
      throw new HttpError(409, "pricing_changed");
    }

    // First photo (thumb), best-effort.
    const { data: photo } = await svc
      .from("listing_photos")
      .select("storage_path")
      .eq("listing_id", listingId)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: order, error: insErr } = await svc
      .from("orders")
      .insert({
        buyer_id: user.id,
        seller_id: listing.owner_id,
        listing_id: listingId,
        listing_title: listing.title,
        listing_thumb: photo?.storage_path ?? null,
        listing_type: listing.listing_type,
        amount_cents: pricing.buyerTotalCents,
        fee_cents: pricing.persistedOrderFeeCents,
        pricing_version: pricing.pricingVersion,
        item_cents: pricing.itemCents,
        buyer_fee_cents: pricing.buyerFeeCents,
        tax_cents: pricing.taxCents,
        seller_fee_cents: pricing.sellerFeeCents,
        payment_method: paymentMethod,
        deposit_cents: pricing.depositCents,
        rental_start: pricing.rentalStart,
        rental_end: pricing.rentalEnd,
        status: "AWAITING_PICKUP",
        offer_id: resolvedOfferId,
      })
      .select("*")
      .single();
    if (insErr) throw new HttpError(500, insErr.message);

    await svc.from("order_events").insert({
      order_id: order.id,
      actor_id: user.id,
      from_status: null,
      to_status: "AWAITING_PICKUP",
      note: resolvedOfferId
        ? "created_from_offer"
        : paymentMethod === "handoff"
          ? "created_handoff_direct"
          : "created_direct",
    });

    if (resolvedOfferId) {
      await svc
        .from("offers")
        .update({ order_id: order.id })
        .eq("id", resolvedOfferId);
    }

    let threadId: string | null = null;
    if (paymentMethod === "handoff") {
      threadId = await ensureHandoffThread(svc, {
        listingId,
        buyerId: user.id,
        sellerId: listing.owner_id as string,
      });
      await recordHandoffFeeReceivable(svc, {
        orderId: order.id as string,
        sellerId: listing.owner_id as string,
        // The actual sale amount — listing price for a direct handoff, the
        // agreed offer amount if this handoff settles an accepted offer.
        sellerFeeCents: pricing.sellerFeeCents,
      });
    }

    const response = { ...toOrder(order), threadId };
    await idem.commit(response);
    return json(response, 201);
  } catch (err) {
    if (err instanceof PricingError) return json({ error: err.code }, 400);
    if (err instanceof HttpError)
      return json({ error: err.message }, err.status);
    return json({ error: "internal_error" }, 500);
  }
});

// Verbatim French copy required by issue #36 — must match exactly.
const HANDOFF_SYSTEM_MESSAGE =
  "La vente a été conclue entre vous. Vous pouvez convenir ici de l’heure " +
  "et du lieu exacts de la rencontre.";

// Opens (or reuses) the buyer/seller thread for this listing and posts the
// automatic handoff system message. Mirrors mobile `threadsApi.open`'s
// find-or-create, run here under service role so it lands atomically with the
// order + inside the same idempotent call (a retried request replays the
// cached response and never re-runs this). No dedicated "system" profile
// exists yet, so `sender_id` is set to the buyer (the actor confirming the
// handoff) — mobile renders SYSTEM-kind messages the same regardless of sender.
async function ensureHandoffThread(
  svc: ReturnType<typeof serviceClient>,
  {
    listingId,
    buyerId,
    sellerId,
  }: { listingId: string; buyerId: string; sellerId: string },
): Promise<string> {
  const { data: existing } = await svc
    .from("threads")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .maybeSingle<{ id: string }>();

  let threadId = existing?.id ?? null;
  if (!threadId) {
    const { data: inserted, error } = await svc
      .from("threads")
      .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
      .select("id")
      .single<{ id: string }>();
    if (error) {
      // Unique (listing_id, buyer_id) race: another concurrent call created it first.
      const { data: raced } = await svc
        .from("threads")
        .select("id")
        .eq("listing_id", listingId)
        .eq("buyer_id", buyerId)
        .maybeSingle<{ id: string }>();
      if (!raced) throw new HttpError(500, error.message);
      threadId = raced.id;
    } else {
      threadId = inserted.id;
    }
  }

  await svc.from("messages").insert({
    thread_id: threadId,
    sender_id: buyerId,
    kind: "SYSTEM",
    text: HANDOFF_SYSTEM_MESSAGE,
  });

  return threadId;
}

// SCR-019 / ADR-0003 — records the #30 platform fee as owed by the seller
// instead of collecting it now (no Stripe capture exists for a handoff sale
// to deduct it from). `seller_fee_receivables_one_per_order` (unique on
// order_id) plus this whole call being inside `idempotentReplay` means a
// retry never double-books the debt. Settlement (deducting this at the
// seller's next real Connect payout) is issue #35's work, not this function's.
async function recordHandoffFeeReceivable(
  svc: ReturnType<typeof serviceClient>,
  {
    orderId,
    sellerId,
    sellerFeeCents,
  }: {
    orderId: string;
    sellerId: string;
    sellerFeeCents: number;
  },
): Promise<void> {
  if (sellerFeeCents <= 0) return;
  await svc.from("seller_fee_receivables").insert({
    seller_id: sellerId,
    order_id: orderId,
    reason: "handoff_no_card",
    amount_cents: sellerFeeCents,
  });
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
    pricingVersion: o.pricing_version,
    itemCents: o.item_cents,
    buyerFeeCents: o.buyer_fee_cents,
    taxCents: o.tax_cents,
    sellerFeeCents: o.seller_fee_cents,
    paymentMethod: o.payment_method,
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
