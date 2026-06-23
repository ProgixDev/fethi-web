// Shared Supabase client factory + auth/idempotency helpers for the
// transactional Edge Functions (offers-respond, orders-create, orders-transition).
//
// Two clients:
//  - `userClientFromReq` runs AS THE CALLER (their JWT) — used only to AUTHENTICATE
//    and to read rows the caller is allowed to see, under their RLS.
//  - `serviceClient` bypasses RLS — used to perform the actual state transition
//    after every invariant has been checked. Raw clients can never write these
//    tables directly (orders/offers status has no client write policy), so the
//    service role is the ONLY path that mutates order/offer state.
//
// Secrets are Edge secrets (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY),
// never NEXT_PUBLIC/EXPO_PUBLIC. They are injected by the Supabase runtime.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function userClientFromReq(req: Request): SupabaseClient {
  const authHeader = req.headers.get('Authorization') ?? '';
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requireUser(req: Request): Promise<{ id: string }> {
  const client = userClientFromReq(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    throw new HttpError(401, 'unauthorized');
  }
  return { id: data.user.id };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Idempotency — backed by public.idempotency_keys (service-role only).
// Returns a cached response if this (scope, key) was already processed; otherwise
// claims the key so a concurrent retry cannot double-apply.
// ---------------------------------------------------------------------------
export async function idempotentReplay(
  svc: SupabaseClient,
  scope: string,
  key: string | null,
): Promise<{ cached: Response | null; commit: (body: unknown) => Promise<void> }> {
  if (!key) {
    // No Idempotency-Key header => no dedup, no commit.
    return { cached: null, commit: async () => {} };
  }

  const existing = await svc
    .from('idempotency_keys')
    .select('response')
    .eq('scope', scope)
    .eq('key', key)
    .maybeSingle();

  if (existing.data?.response) {
    return {
      cached: new Response(JSON.stringify(existing.data.response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
      commit: async () => {},
    };
  }

  // Claim the key (unique PK on (scope, key)); if a racing call already claimed
  // it, surface 409 so the client retries and reads the cached response.
  const claim = await svc
    .from('idempotency_keys')
    .insert({ scope, key })
    .select('key')
    .maybeSingle();
  if (claim.error && claim.error.code === '23505') {
    throw new HttpError(409, 'idempotency_key_in_flight');
  }

  return {
    cached: null,
    commit: async (body: unknown) => {
      await svc
        .from('idempotency_keys')
        .update({ response: body })
        .eq('scope', scope)
        .eq('key', key);
    },
  };
}
