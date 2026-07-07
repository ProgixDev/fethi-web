// payments-create-intent — idempotent PaymentIntent creation for an order.
//
// POST { orderId, amountCents?, currency? }   (mobile paymentsApi.createIntent)
// Auth: user JWT (the buyer).
// Idempotency: REUSES existing PaymentIntent for the same order if present.
// Returns: { clientSecret, paymentIntentId, amount, currency }
//
// Invariants:
//   - buyer must own the order (order.buyer_id === user.id)
//   - if order already has payment_intent_id, reuse it (idempotent)
//   - otherwise, create Stripe PaymentIntent and attach to order
//
// Edge case: order not found → 404; not owned by buyer → 403
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
    const amountOverride: number | null = body.amountCents ?? null;
    const currency = body.currency ?? 'eur';

    if (!orderId) throw new HttpError(400, 'orderId required');

    // Resolve the order
    const { data: order, error: oErr } = await svc
      .from('orders')
      .select('id, buyer_id, amount_cents, payment_intent_id, payment_status, paid_at')
      .eq('id', orderId)
      .maybeSingle();

    if (oErr) throw new HttpError(500, oErr.message);
    if (!order) throw new HttpError(404, 'order_not_found');
    if (order.buyer_id !== user.id) throw new HttpError(403, 'not_your_order');

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

    // Calculate amount (order total or override)
    const amountCents = amountOverride ?? order.amount_cents;
    if (amountCents <= 0) throw new HttpError(400, 'amount_must_be_positive');

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      metadata: {
        orderId,
        buyerId: user.id,
      },
    });

    // Attach to order
    const { error: updateErr } = await svc
      .from('orders')
      .update({
        payment_intent_id: paymentIntent.id,
        payment_status: 'PENDING',
      })
      .eq('id', orderId);

    if (updateErr) throw new HttpError(500, updateErr.message);

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
