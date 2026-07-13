// connect-onboard — Stripe Connect Express onboarding link generation.
//
// POST { returnUrl?, refreshUrl? }   (mobile connectApi.startOnboarding)
// Auth: user JWT (the seller)
// Returns: { url, accountId, onboardingStatus }
//
// Invariants:
//   - one Connect account per user (create if missing)
//   - return the Stripe Account Link URL for onboarding
//   - store onboarding state in payout_accounts
//
// Edge cases:
//   - Stripe unconfigured → 503
//   - user already has account → return existing, don't recreate
import { corsHeaders, json } from '../_shared/cors.ts';
import {
  HttpError,
  requireUser,
  serviceClient,
} from '../_shared/supabase.ts';
import Stripe from 'npm:stripe@^22.3.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
// NOTE: this Express + Account-Links flow (stripe.accounts.create({type:'express'})
// + stripe.accountLinks.create) does NOT use a Connect client id — that's only for
// the OAuth Connect flow. So the only required secret is STRIPE_SECRET_KEY; the
// platform must additionally have Connect enabled in the Stripe Dashboard.

// The Express account's country is fixed at creation and cannot be changed later.
// Precedence: request body `country` (if a valid ISO-3166 alpha-2) → env default → FR.
// We don't derive it from `profiles` because no country is captured there.
const DEFAULT_CONNECT_COUNTRY =
  (Deno.env.get('STRIPE_CONNECT_DEFAULT_COUNTRY') ?? 'FR').toUpperCase();

function resolveCountry(raw: unknown): string {
  if (typeof raw === 'string' && /^[A-Za-z]{2}$/.test(raw)) {
    return raw.toUpperCase();
  }
  return DEFAULT_CONNECT_COUNTRY;
}

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
    const returnUrl = body.returnUrl ?? `${req.headers.get('origin')}/seller/dashboard`;
    const refreshUrl = body.refreshUrl ?? `${req.headers.get('origin')}/seller/onboarding`;

    // Check if user already has a Connect account
    const { data: existingAccount } = await svc
      .from('payout_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let stripeAccountId: string;
    let onboardingStatus = 'PENDING';

    if (existingAccount) {
      stripeAccountId = existingAccount.stripe_account_id;
      onboardingStatus = existingAccount.onboarding_status;

      // Fetch latest status from Stripe
      try {
        const account = await stripe.accounts.retrieve(stripeAccountId);
        if (account.payouts_enabled) {
          onboardingStatus = 'ENABLED';
        } else if (account.details_submitted) {
          onboardingStatus = 'RESTRICTED';
        }

        // Sync to DB
        await svc
          .from('payout_accounts')
          .update({
            onboarding_status: onboardingStatus,
            payouts_enabled: account.payouts_enabled ?? false,
            details_submitted: account.details_submitted ?? false,
          })
          .eq('id', existingAccount.id);
      } catch (err) {
        console.error('Failed to fetch Stripe account:', err);
      }
    } else {
      // Create new Connect account (Express). The seller's real auth email is
      // used so Stripe can reach them for KYC; fall back to a stable per-user
      // placeholder only if the account somehow has no email on file.
      const account = await stripe.accounts.create({
        type: 'express',
        country: resolveCountry(body.country),
        email: user.email ?? `${user.id}@mystreet.temp`,
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          userId: user.id,
        },
      });

      stripeAccountId = account.id;

      // Store in payout_accounts
      await svc
        .from('payout_accounts')
        .insert({
          user_id: user.id,
          stripe_account_id: account.id,
          onboarding_status: 'PENDING',
          payouts_enabled: false,
          details_submitted: false,
        });
    }

    // If already enabled, return early (no onboarding needed)
    if (onboardingStatus === 'ENABLED') {
      return json({
        url: null,
        accountId: stripeAccountId,
        onboardingStatus,
        message: 'already_enabled',
      });
    }

    // Generate Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return json({
      url: accountLink.url,
      accountId: stripeAccountId,
      onboardingStatus,
    });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    return json({ error: 'internal_error' }, 500);
  }
});
