// offers-respond — server-enforced offer state machine.
//
// POST { offerId, action: 'accept' | 'reject' | 'withdraw', message? }
//   accept   — listing owner (seller) accepts a PENDING, non-expired offer.
//   reject   — listing owner rejects a PENDING offer.
//   withdraw — buyer withdraws their own PENDING offer.
//
// Auth: user JWT (mobile offersApi.accept/reject/withdraw map onto this).
// Idempotency: optional `Idempotency-Key` header — a retry replays the prior
// response instead of re-applying.
//
// Invariants (mobile WEB-005 edge cases):
//   - only PENDING offers can transition (double-accept/expired/already-resolved → 409)
//   - expired offer cannot be accepted (auto-marked EXPIRED → 409)
//   - accept/reject only by the seller; withdraw only by the buyer (→ 403)
//
// Mutations run as the SERVICE ROLE because offers has no client UPDATE policy.
import { corsHeaders, json } from '../_shared/cors.ts';
import {
  HttpError,
  idempotentReplay,
  requireUser,
  serviceClient,
} from '../_shared/supabase.ts';

type Action = 'accept' | 'reject' | 'withdraw';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const idemKey = req.headers.get('Idempotency-Key');

    const body = await req.json().catch(() => ({}));
    const offerId: string | undefined = body.offerId;
    const action: Action | undefined = body.action;
    const message: string | null = body.message ?? null;
    if (!offerId || !action) throw new HttpError(400, 'offerId and action required');

    const idem = await idempotentReplay(svc, `offers.respond:${action}`, idemKey);
    if (idem.cached) return idem.cached;

    // Load the offer under service role (we enforce authorization explicitly).
    const { data: offer, error } = await svc
      .from('offers')
      .select('*')
      .eq('id', offerId)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!offer) throw new HttpError(404, 'offer_not_found');

    // Authorize by action.
    if (action === 'withdraw' && offer.buyer_id !== user.id) {
      throw new HttpError(403, 'only_buyer_can_withdraw');
    }
    if ((action === 'accept' || action === 'reject') && offer.seller_id !== user.id) {
      throw new HttpError(403, 'only_seller_can_respond');
    }

    // Only PENDING offers transition (blocks double-accept / re-resolve).
    if (offer.status !== 'PENDING') {
      throw new HttpError(409, `offer_not_pending:${offer.status}`);
    }

    // Expiry: an accept on an expired offer is rejected; mark it EXPIRED.
    const expired = new Date(offer.expires_at).getTime() <= Date.now();
    if (expired) {
      await svc
        .from('offers')
        .update({ status: 'EXPIRED', responded_at: new Date().toISOString() })
        .eq('id', offerId)
        .eq('status', 'PENDING');
      throw new HttpError(409, 'offer_expired');
    }

    if (action === 'accept') {
      const { data: accepted, error: acceptError } = await svc.rpc('accept_offer', {
        p_offer_id: offerId,
        p_seller_id: user.id,
        p_message: message,
      });
      if (acceptError) throw new HttpError(409, acceptError.message);
      const response = toOfferResponse(accepted as Record<string, unknown>);
      await idem.commit(response);
      return json(response, 200);
    }

    const nextStatus = action === 'reject' ? 'REJECTED' : 'WITHDRAWN';

    // Guarded update: status must still be PENDING (optimistic concurrency).
    const { data: updated, error: upErr } = await svc
      .from('offers')
      .update({
        status: nextStatus,
        response_message: message,
        responded_at: new Date().toISOString(),
      })
      .eq('id', offerId)
      .eq('status', 'PENDING')
      .select('*')
      .maybeSingle();
    if (upErr) throw new HttpError(500, upErr.message);
    if (!updated) throw new HttpError(409, 'offer_already_resolved');

    const response = toOfferResponse(updated);
    await idem.commit(response);
    return json(response, 200);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    return json({ error: 'internal_error' }, 500);
  }
});

// DB row → mobile OfferResponse shape (camelCase contract).
function toOfferResponse(o: Record<string, unknown>) {
  return {
    id: o.id,
    listingId: o.listing_id,
    buyerId: o.buyer_id,
    sellerId: o.seller_id,
    amountCents: o.amount_cents,
    message: o.message,
    status: o.status,
    responseMessage: o.response_message,
    respondedAt: o.responded_at,
    expiresAt: o.expires_at,
    createdAt: o.created_at,
  };
}
