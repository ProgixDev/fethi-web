/**
 * Service-role Supabase client (admin app) — SERVER ONLY.
 *
 * Uses SUPABASE_SECRET_KEY (the new-format replacement for the legacy
 * service_role key): FULL ACCESS, **bypasses RLS**. Only for staff/admin server
 * logic that legitimately needs elevation (KYC, moderation, finance, disputes)
 * inside Route Handlers / Server Actions. NEVER import this from a Client
 * Component or anything reachable from the browser bundle.
 *
 * The secret key is read from a non-`NEXT_PUBLIC_*` var so it can never be
 * inlined into client JS. The runtime guard below is a second line of defence.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/database.types';

if (typeof window !== 'undefined') {
  throw new Error(
    '[supabase] admin.ts (service-role) was imported in the browser. ' +
      'This module is server-only — use ./client or ./server on the client/session path.',
  );
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

export function createAdminClient() {
  if (!url || !secretKey) {
    throw new Error(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY missing (server-only).',
    );
  }
  return createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
