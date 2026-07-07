// stripe-webhook — signature-verified, deduplicated Stripe webhook handler.
//
// POST /stripe/webhook (Stripe → Edge Function, signature verified)
// Auth: Stripe signature verification (no user JWT)
// Idempotency: Dedupes by stripe_event_id (at-least-once delivery guard)
//
// Events handled:
//   - payment_intent.succeeded → flip order.paymentStatus=SUCCEEDED, set paid_at
//   - payment_intent.payment_failed → flip order.paymentStatus=FAILED
//   - payment_intent.amount_refundable.updated (refund) → REFUNDED/PARTIALLY_REFUNDED
//   - charge.dispute.created → DISPUTED
//   - account.updated → update payout_accounts.onboarding_status
//
// Edge cases:
//   - Bad signature → 400, do not mutate
//   - Duplicate event → 200, skip processing (already processed)
//   - Order not found → log 404, continue (order may have been deleted)
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';
import Stripe from 'npm:stripe@^22.3.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');


Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Stripe unconfigured → 503 (signals missing config, not a bug). Kept OUT of
  // the try below so it can't be masked as a generic 500 webhook_error.
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return json({ error: 'stripe_unconfigured' }, 503);
  }

  try {
    const signature = req.headers.get('Stripe-Signature');
    if (!signature) {
      return json({ error: 'missing_signature' }, 400);
    }

    const body = await req.text();
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Deno,
    });

    // Verify signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return json({ error: 'invalid_signature' }, 400);
    }

    const svc = serviceClient();

    // Dedup: check if we've already processed this event
    const { data: existingEvent } = await svc
      .from('webhook_deduplication')
      .select('id')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return json({ received: true, duplicated: true }, 200);
    }

    // Record that we're processing this event (idempotent guard)
    await svc
      .from('webhook_deduplication')
      .insert({ stripe_event_id: event.id });

    // Handle event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata.orderId;

        if (!orderId) {
          console.log('PaymentIntent missing orderId metadata, skipping');
          break;
        }

        // Update order payment status
        await svc
          .from('orders')
          .update({
            payment_status: 'SUCCEEDED',
            paid_at: new Date().toISOString(),
          })
          .eq('payment_intent_id', pi.id);

        // Create payment record
        await svc
          .from('payments')
          .insert({
            order_id: orderId,
            stripe_payment_intent_id: pi.id,
            amount_cents: pi.amount,
            status: 'SUCCEEDED',
            metadata: pi as unknown as Record<string, unknown>,
          });

        console.log(`PaymentIntent ${pi.id} succeeded for order ${orderId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata.orderId;

        if (!orderId) break;

        await svc
          .from('orders')
          .update({ payment_status: 'FAILED' })
          .eq('payment_intent_id', pi.id);

        await svc
          .from('payments')
          .upsert({
            order_id: orderId,
            stripe_payment_intent_id: pi.id,
            amount_cents: pi.amount,
            status: 'FAILED',
            metadata: pi as unknown as Record<string, unknown>,
          });

        console.log(`PaymentIntent ${pi.id} failed for order ${orderId}`);
        break;
      }

      case 'charge.refunded':
      case 'charge.refund.updated': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        // Calculate refund status (partial or full)
        const amountRefunded = charge.amount_refunded;
        const totalAmount = charge.amount;
        const isPartialRefund = amountRefunded < totalAmount;

        // Update order payment status
        await svc
          .from('orders')
          .update({
            payment_status: isPartialRefund ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
          })
          .eq('payment_intent_id', paymentIntentId);

        // Update payment record
        await svc
          .from('payments')
          .update({
            status: isPartialRefund ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
          })
          .eq('stripe_payment_intent_id', paymentIntentId);

        console.log(`Charge ${charge.id} refunded for PaymentIntent ${paymentIntentId}`);
        break;
      }

      case 'charge.dispute.created': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        await svc
          .from('orders')
          .update({ payment_status: 'DISPUTED' })
          .eq('payment_intent_id', paymentIntentId);

        await svc
          .from('payments')
          .update({ status: 'DISPUTED' })
          .eq('stripe_payment_intent_id', paymentIntentId);

        console.log(`Dispute created for PaymentIntent ${paymentIntentId}`);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;

        // Find the payout_accounts row by stripe_account_id
        const { data: payoutAccount } = await svc
          .from('payout_accounts')
          .select('id')
          .eq('stripe_account_id', account.id)
          .maybeSingle();

        if (payoutAccount) {
          // Determine onboarding status
          let onboardingStatus = 'PENDING';
          if (account.payouts_enabled) {
            onboardingStatus = 'ENABLED';
          } else if (account.details_submitted) {
            onboardingStatus = 'RESTRICTED';
          }

          await svc
            .from('payout_accounts')
            .update({
              onboarding_status: onboardingStatus,
              payouts_enabled: account.payouts_enabled ?? false,
              details_submitted: account.details_submitted ?? false,
              metadata: account as unknown as Record<string, unknown>,
            })
            .eq('id', payoutAccount.id);

          console.log(`Updated payout account ${account.id} to ${onboardingStatus}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true }, 200);
  } catch (err) {
    console.error('Webhook error:', err);
    return json({ error: 'webhook_error' }, 500);
  }
});
