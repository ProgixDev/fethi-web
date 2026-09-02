// held-proceeds-status — party-visible status for the payment hold (#35).
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, requireUser, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const user = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === 'string' ? body.orderId : null;
    if (!orderId) throw new HttpError(400, 'orderId required');
    const svc = serviceClient();
    const { data: order, error: orderError } = await svc
      .from('orders').select('buyer_id, seller_id').eq('id', orderId).maybeSingle();
    if (orderError) throw new HttpError(500, orderError.message);
    if (!order) throw new HttpError(404, 'order_not_found');
    if (user.id !== order.buyer_id && user.id !== order.seller_id) throw new HttpError(403, 'not_a_party');
    const { data: hold, error: holdError } = await svc
      .from('held_seller_proceeds')
      .select('status, gross_cents, seller_net_cents, release_after, review_after, released_at, terminal_reason')
      .eq('order_id', orderId)
      .maybeSingle();
    if (holdError) throw new HttpError(500, holdError.message);
    if (!hold) return json({ status: null }, 200);
    const current = hold;
    return json({
      status: current.status,
      grossCents: current.gross_cents,
      sellerNetCents: current.seller_net_cents,
      releaseAfter: current.release_after,
      reviewAfter: current.review_after,
      releasedAt: current.released_at,
      reason: current.terminal_reason,
    }, 200);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    return json({ error: 'internal_error' }, 500);
  }
});
