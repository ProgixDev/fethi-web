// payments-config — returns Stripe publishable key + configured flag.
//
// POST or GET /payments-config
// Auth: JWT (verify_jwt=true) — the mobile client reaches it through
//   supabase.functions.invoke(), which ALWAYS issues a POST, so POST must be
//   accepted; GET is kept for direct/curl checks.
// Returns: { publishableKey, configured }
// 503 when Stripe is unconfigured (missing secrets).
import { corsHeaders, json } from '../_shared/cors.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = Deno.env.get('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // Stripe unconfigured → 503 (not 500; signals missing config, not a bug)
  if (!STRIPE_SECRET_KEY || !NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return json({ error: 'stripe_unconfigured' }, 503);
  }

  return json({
    publishableKey: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    configured: true,
  });
});
