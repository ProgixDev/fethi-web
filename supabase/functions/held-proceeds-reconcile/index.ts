// held-proceeds-reconcile — service-only scheduled lifecycle worker for #35.
//
// Invoke every five minutes with X-Reconcile-Secret. It releases due
// buyer-authorised holds and marks holds with no buyer confirmation after seven
// days for staff review. It never auto-releases or auto-refunds a timeout.
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';
import { markExpiredUnconfirmedHolds, releaseDueHold, reverseTerminalTransfer } from '../_shared/held-proceeds.ts';
import Stripe from 'npm:stripe@^22.3.0';

const RECONCILE_SECRET = Deno.env.get('HELD_PROCEEDS_RECONCILE_SECRET');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!RECONCILE_SECRET || !STRIPE_SECRET_KEY) return json({ error: 'reconciler_unconfigured' }, 503);
  if (req.headers.get('X-Reconcile-Secret') !== RECONCILE_SECRET) return json({ error: 'unauthorized' }, 401);

  try {
    const svc = serviceClient();
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16', httpClient: Deno });
    const timedOut = await markExpiredUnconfirmedHolds(svc);
    const { data: due, error } = await svc
      .from('held_seller_proceeds')
      .select('id, order_id, seller_id, stripe_charge_id, seller_net_cents, status, release_after')
      .eq('status', 'RELEASE_PENDING')
      .lte('release_after', new Date().toISOString())
      .limit(100);
    if (error) throw new Error(`due_hold_lookup_failed:${error.message}`);

    let released = 0;
    let deferred = 0;
    for (const hold of due ?? []) {
      try {
        const outcome = await releaseDueHold(svc, stripe, hold);
        if (outcome === 'released') released += 1;
        else if (outcome !== 'busy') deferred += 1;
      } catch (error) {
        deferred += 1;
        console.error(`hold ${hold.id} deferred`, error);
      }
    }
    const { data: reversalPending, error: reversalError } = await svc
      .from('held_seller_proceeds')
      .select('order_id, terminal_reason')
      .in('status', ['REFUNDED', 'DISPUTED', 'REVIEW_REQUIRED'])
      .like('terminal_reason', '%transfer_reversal_pending%')
      .limit(100);
    if (reversalError) throw new Error(`pending_reversal_lookup_failed:${reversalError.message}`);
    let reversalsRetried = 0;
    for (const hold of reversalPending ?? []) {
      const reason = hold.terminal_reason?.startsWith('dispute') ? 'dispute'
        : hold.terminal_reason?.startsWith('refund') ? 'refund' : 'terminal_race';
      const outcome = await reverseTerminalTransfer(svc, stripe, hold.order_id, reason);
      if (outcome !== 'not_transferred') reversalsRetried += 1;
    }
    return json({ released, deferred, reviewRequired: timedOut, reversalsRetried }, 200);
  } catch (error) {
    console.error('held proceeds reconciler error', error);
    return json({ error: 'reconcile_failed' }, 500);
  }
});
