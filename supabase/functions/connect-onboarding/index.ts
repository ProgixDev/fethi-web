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
import Stripe from 'npm:stripe@22.6.0';

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

// Fallback base used when a caller supplies neither returnUrl/refreshUrl NOR
// a usable `origin` header — the mobile app is exactly this case (React
// Native's fetch never sends `Origin`, so `req.headers.get('origin')` is
// null there). Without this guard the old code built the literal string
// "null/seller/dashboard", which Stripe's accountLinks.create() rejects with
// `url_invalid` ("Not a valid URL"), breaking onboarding for every mobile
// caller. Stripe's Account Links API requires a real http(s) URL — it
// rejects a custom app URI scheme (mystreet://...) the exact same way, so
// this fallback (and the mobile client's own explicit value — see
// connectApi.startOnboarding) must be an https URL too, not a deep link. The
// seller just manually switches back to the app afterward; the webhook
// keeps payout_accounts in sync regardless of what this page does.
const MOBILE_APP_RETURN_BASE =
  Deno.env.get('MOBILE_APP_RETURN_BASE') ?? 'https://mystreet-web.vercel.app/stripe/return';

function resolveRedirectUrl(explicit: unknown, origin: string | null, path: string): string {
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  if (origin && /^https?:\/\//i.test(origin)) return `${origin}${path}`;
  return MOBILE_APP_RETURN_BASE;
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
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json().catch(() => ({}));
    const origin = req.headers.get('origin');
    const returnUrl = resolveRedirectUrl(body.returnUrl, origin, '/seller/dashboard');
    const refreshUrl = resolveRedirectUrl(body.refreshUrl, origin, '/seller/onboarding');

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
    // Was previously swallowed entirely — the caught exception never reached
    // Stripe's own logs (nothing to see there if the throw happens before
    // the API call goes out), and never reached Supabase's function logs
    // either since nothing logged it. Log it so the actual cause is visible
    // in the Supabase dashboard's Edge Function logs.
    console.error('connect-onboarding failed:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
