// orders-price-quote — authenticated, server-authoritative checkout preview.
//
// POST { listingId, offerId?, rentalStart?, rentalEnd?, serviceHours?, paymentMethod? }
// Returns the exact issue #30 breakdown used later by orders-create.
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  calculatePricing,
  type ListingPricing,
  PricingError,
} from "../_shared/pricing.ts";
import { HttpError, requireUser, serviceClient } from "../_shared/supabase.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const body = await req.json().catch(() => ({}));
    const listingId: string | undefined = body.listingId;
    const offerId: string | null = body.offerId ?? null;
    const paymentMethod: "card" | "handoff" =
      body.paymentMethod === "handoff" ? "handoff" : "card";
    if (!listingId) throw new HttpError(400, "listingId required");

    const { data: listing, error: listingError } = await svc
      .from("listings")
      .select(
        "id, owner_id, listing_type, price_cents, price_per_day_cents, " +
          "deposit_cents, hourly_rate_cents, flat_rate_cents",
      )
      .eq("id", listingId)
      .maybeSingle();
    if (listingError) throw new HttpError(500, listingError.message);
    if (!listing) throw new HttpError(404, "listing_not_found");
    if (listing.owner_id === user.id) {
      throw new HttpError(409, "cannot_buy_own_listing");
    }
    if (paymentMethod === "handoff" && listing.listing_type !== "VENTE") {
      throw new HttpError(400, "handoff_unsupported_for_listing_type");
    }

    let agreedItemCents: number | null = null;
    if (offerId) {
      const { data: offer, error: offerError } = await svc
        .from("offers")
        .select("id, buyer_id, listing_id, amount_cents, status, order_id")
        .eq("id", offerId)
        .maybeSingle();
      if (offerError) throw new HttpError(500, offerError.message);
      if (!offer) throw new HttpError(404, "offer_not_found");
      if (offer.buyer_id !== user.id)
        throw new HttpError(403, "offer_not_yours");
      if (offer.listing_id !== listingId) {
        throw new HttpError(409, "offer_listing_mismatch");
      }
      if (offer.status !== "ACCEPTED") {
        throw new HttpError(409, `offer_not_accepted:${offer.status}`);
      }
      if (offer.order_id) throw new HttpError(409, "offer_already_ordered");
      agreedItemCents = offer.amount_cents;
    }

    const quote = calculatePricing(listing as ListingPricing, {
      paymentMethod,
      rentalStart: body.rentalStart ?? null,
      rentalEnd: body.rentalEnd ?? null,
      serviceHours:
        typeof body.serviceHours === "number" ? body.serviceHours : null,
      agreedItemCents,
      agreementKey: offerId,
    });
    return json(quote, 200);
  } catch (error) {
    if (error instanceof PricingError) {
      return json({ error: error.code }, 400);
    }
    if (error instanceof HttpError) {
      return json({ error: error.message }, error.status);
    }
    console.error("orders-price-quote failed:", error);
    return json({ error: "internal_error" }, 500);
  }
});
