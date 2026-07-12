// payments-create-intent — idempotent PaymentIntent creation for an order.
//
// POST { orderId }   (mobile paymentsApi.createIntent)
// Auth: user JWT (the buyer).
// Idempotency: REUSES existing PaymentIntent for the same order if present.
// Returns: { clientSecret, paymentIntentId, amount, currency }
//
// Invariants:
//   - buyer must own the order (order.buyer_id === user.id)
//   - the charged amount is ALWAYS order.amount_cents (server-authoritative).
//     The client CANNOT set/override the amount or currency — otherwise a buyer
//     could pay 1 cent for a 100€ order and the webhook would still flip the
//     order to SUCCEEDED. Pricing lives on the order, written server-side.
//   - if order already has payment_intent_id, reuse it (idempotent). Creation is
//     also idempotent at Stripe (idempotencyKey=orderId) and guarded by a
//     conditional attach so a concurrent double-call can't orphan an intent.
//
// Edge case: order not found → 404; not owned by buyer → 403;
//   already paid → 409 order_already_paid
import { corsHeaders, json } from '../_shared/cors.ts';
import {
  HttpError,
  requireUser,
  serviceClient,
} from '../_shared/supabase.ts';
import Stripe from 'npm:stripe@^22.3.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    // Stripe unconfigured → 503
    if (!STRIPE_SECRET_KEY) {
      throw new HttpError(503, 'stripe_unconfigured');
    }

    const user = await requireUser(req);
    const svc = serviceClient();
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Deno,
    });

    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body.orderId;
    if (!orderId) throw new HttpError(400, 'orderId required');

    // The marketplace currency is fixed server-side (EUR); never client-supplied.
    const CURRENCY = 'eur';

    // Resolve the order
    const { data: order, error: oErr } = await svc
      .from('orders')
      .select('id, buyer_id, amount_cents, payment_intent_id, payment_status, paid_at')
      .eq('id', orderId)
      .maybeSingle();

    if (oErr) throw new HttpError(500, oErr.message);
    if (!order) throw new HttpError(404, 'order_not_found');
    if (order.buyer_id !== user.id) throw new HttpError(403, 'not_your_order');

    // Already settled → don't mint a new intent for a paid order.
    if (order.payment_status === 'SUCCEEDED' || order.paid_at) {
      throw new HttpError(409, 'order_already_paid');
    }

    // Idempotent: if order already has a PaymentIntent, return it
    if (order.payment_intent_id) {
      const existingIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);
      return json({
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
        amount: existingIntent.amount,
        currency: existingIntent.currency,
        status: existingIntent.status,
      });
    }

    // Amount is ALWAYS the server-recorded order total — never client-supplied.
    const amountCents = order.amount_cents;
    if (!amountCents || amountCents <= 0) throw new HttpError(400, 'order_amount_invalid');

    // Create PaymentIntent. `idempotencyKey=orderId` makes a retried creation
    // return the SAME intent instead of minting a duplicate (Stripe-side guard
    // against the read-null/create/read-null/create race).
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: CURRENCY,
        metadata: { orderId, buyerId: user.id },
      },
      { idempotencyKey: `pi_create:${orderId}` },
    );

    // Conditional attach: only claim the intent if no other concurrent call
    // already attached one. `.is('payment_intent_id', null)` + returning rows
    // detects a lost race → we defer to the winner's intent.
    const { data: attached, error: updateErr } = await svc
      .from('orders')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'PENDING',
      })
      .eq('id', orderId)
      .is('payment_intent_id', null)
      .select('payment_intent_id')
      .maybeSingle();

    if (updateErr) throw new HttpError(500, updateErr.message);

    if (!attached) {
      // Lost the race: another call attached first. Return that intent and let
      // ours expire unused (same amount/order, so it's harmless).
      const { data: winner } = await svc
        .from('orders')
        .select('payment_intent_id')
        .eq('id', orderId)
        .maybeSingle();
      const winnerIntent = winner?.payment_intent_id
        ? await stripe.paymentIntents.retrieve(winner.payment_intent_id)
        : paymentIntent;
      return json({
        clientSecret: winnerIntent.client_secret,
        paymentIntentId: winnerIntent.id,
        amount: winnerIntent.amount,
        currency: winnerIntent.currency,
        status: winnerIntent.status,
      });
    }

    return json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    return json({ error: 'internal_error' }, 500);
  }
});
