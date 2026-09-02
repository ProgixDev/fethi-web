// connect-dashboard-link — Stripe Express dashboard login-link generation.
//
// POST {}                              (mobile connectApi.dashboardLink)
// Auth: user JWT (the seller)
// Returns: { url }                     — single-use Express dashboard login link
//
// Why this exists (WEB-021 / pairs with mobile TASK-019):
//   With Connect Express, STRIPE owns the seller's balance, payouts, transaction
//   history, bank account and payout schedule. The app must not replicate any of
//   it. `stripe.accounts.createLoginLink` opens the seller's own hosted Express
//   dashboard — balance + payouts + history + bank + schedule — with no regulated
//   data ever touching our DB.
//
// Invariants:
//   - login links require a COMPLETED Express account: Stripe rejects the call
//     unless `details_submitted` is true. We refresh the account from Stripe
//     (and sync payout_accounts, same as connect-onboarding) before deciding, so
//     a stale local flag never drives the outcome.
//   - non-enabled / no-account callers get a clean mapped code, never a 500.
//
// Edge cases:
//   - Stripe unconfigured                → 503 stripe_unconfigured
//   - caller has no Connect account      → 409 no_connect_account
//   - account not finished onboarding    → 409 onboarding_incomplete
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, requireUser, serviceClient } from '../_shared/supabase.ts';
import Stripe from 'npm:stripe@22.6.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    if (!STRIPE_SECRET_KEY) {
      throw new HttpError(503, 'stripe_unconfigured');
    }

    const user = await requireUser(req);
    const svc = serviceClient();
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { data: account } = await svc
      .from('payout_accounts')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account?.stripe_account_id) {
      // Never onboarded — the app maps this to "start onboarding first".
      throw new HttpError(409, 'no_connect_account');
    }

    // Refresh from Stripe (source of truth) and sync our mirror, exactly like
    // connect-onboarding, so a stale payout_accounts flag can't gate the link.
    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id);
    const payoutsEnabled = stripeAccount.payouts_enabled ?? false;
    const detailsSubmitted = stripeAccount.details_submitted ?? false;
    const onboardingStatus = payoutsEnabled
      ? 'ENABLED'
      : detailsSubmitted
        ? 'RESTRICTED'
        : 'PENDING';

    await svc
      .from('payout_accounts')
      .update({
        onboarding_status: onboardingStatus,
        payouts_enabled: payoutsEnabled,
        details_submitted: detailsSubmitted,
      })
      .eq('id', account.id);

    // Login links only exist for accounts that have completed onboarding.
    if (!detailsSubmitted) {
      throw new HttpError(409, 'onboarding_incomplete');
    }

    const loginLink = await stripe.accounts.createLoginLink(account.stripe_account_id);

    return json({ url: loginLink.url });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error('connect-dashboard-link failed:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
