// held-proceeds-resolution — finance-approved resolution for a seven-day hold.
// The admin route authenticates its staff session then calls this function with
// HELD_PROCEEDS_RESOLUTION_SECRET; the mobile app can never invoke it.
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, serviceClient } from '../_shared/supabase.ts';
import { releaseDueHold } from '../_shared/held-proceeds.ts';
import Stripe from 'npm:stripe@^22.3.0';

const RESOLUTION_SECRET = Deno.env.get('HELD_PROCEEDS_RESOLUTION_SECRET');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!RESOLUTION_SECRET || !STRIPE_SECRET_KEY) return json({ error: 'resolution_unconfigured' }, 503);
  if (req.headers.get('X-Resolution-Secret') !== RESOLUTION_SECRET) return json({ error: 'unauthorized' }, 401);
  try {
    const { orderId } = await req.json().catch(() => ({}));
    if (typeof orderId !== 'string') throw new HttpError(400, 'orderId required');
    const svc = serviceClient();
    const { data: hold, error } = await svc.from('held_seller_proceeds')
      .update({ status: 'RELEASE_PENDING', release_after: new Date().toISOString(), terminal_reason: 'finance_timeout_release' })
      .eq('order_id', orderId).eq('status', 'REVIEW_REQUIRED')
      .select('id, order_id, seller_id, stripe_charge_id, seller_net_cents, status, release_after')
      .maybeSingle();
    if (error) throw new Error(`resolution_hold_update_failed:${error.message}`);
    if (!hold) throw new HttpError(409, 'hold_not_review_required');
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', httpClient: Deno });
    const outcome = await releaseDueHold(svc, stripe, hold);
    if (outcome !== 'released') throw new HttpError(409, `hold_not_released:${outcome}`);
    return json({ released: true }, 200);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error('held proceeds resolution error', error);
    return json({ error: 'resolution_failed' }, 500);
  }
});
