// kyc-status — read the caller's KYC / payout-onboarding status, mapped to the
// shared KycStatus union ('UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED').
//
// GET /me/kyc-status    (auth: user JWT)
// → { status: KycStatus, source: 'connect' | 'profile', payoutsEnabled?: boolean }
//
// Source of truth is Stripe Connect (WEB-006: payout_accounts + Connect webhooks).
// Until that ships / Stripe is configured, it falls back to the stored
// profiles.kyc_status. GRACEFUL by design: never 500s on missing Stripe config or
// a missing payout_accounts table — it returns the stored status with
// source:'profile'. Self-scoped (returns the CALLER's status only) to avoid an
// IDOR; the admin per-user KYC view is WEB-012 (staff-gated, separate path).
//
// Error bodies are { code, message } to match the mobile client's throwApiError.
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, requireUser, serviceClient } from '../_shared/supabase.ts';

type KycStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

// Map a Stripe Connect account snapshot (as WEB-006 will persist it into
// payout_accounts) to the shared KycStatus. Conservative: only VERIFIED when the
// account can actually take charges AND receive payouts.
function mapConnect(row: {
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
  details_submitted?: boolean | null;
  disabled_reason?: string | null;
}): KycStatus {
  if (row.disabled_reason) return 'REJECTED';
  if (row.charges_enabled && row.payouts_enabled) return 'VERIFIED';
  if (row.details_submitted) return 'PENDING';
  return 'UNVERIFIED';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET') {
    return json({ code: 'METHOD_NOT_ALLOWED', message: 'GET only' }, 405);
  }

  try {
    const user = await requireUser(req);
    const svc = serviceClient();

    // Prefer Stripe Connect state (WEB-006). The table may not exist yet — any
    // error here is non-fatal and falls through to the profile status.
    if (Deno.env.get('STRIPE_SECRET_KEY')) {
      const { data: acct, error } = await svc
        .from('payout_accounts')
        .select('charges_enabled, payouts_enabled, details_submitted, disabled_reason')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!error && acct) {
        return json(
          {
            status: mapConnect(acct),
            source: 'connect',
            payoutsEnabled: acct.payouts_enabled ?? false,
          },
          200,
        );
      }
    }

    // Fallback: the stored profile KYC status.
    const { data: prof, error: pErr } = await svc
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .maybeSingle();
    if (pErr) throw new HttpError(500, pErr.message);

    const stored = (prof?.kyc_status as string | undefined) ?? 'UNVERIFIED';
    // Web stores an extra 'REVIEW' value; collapse it to the shared 'PENDING'.
    const status: KycStatus =
      stored === 'VERIFIED' || stored === 'PENDING' || stored === 'REJECTED'
        ? (stored as KycStatus)
        : stored === 'REVIEW'
          ? 'PENDING'
          : 'UNVERIFIED';

    return json({ status, source: 'profile' }, 200);
  } catch (err) {
    if (err instanceof HttpError) {
      const code = err.status === 401 ? 'UNAUTHORIZED' : 'KYC_STATUS_FAILED';
      return json({ code, message: err.message }, err.status);
    }
    return json({ code: 'INTERNAL', message: 'internal_error' }, 500);
  }
});
