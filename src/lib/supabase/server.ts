/**
 * Server Supabase client (admin app).
 *
 * Reads/writes the auth session from Next's cookie store. Use in Server
 * Components, Route Handlers, and Server Actions. Anon/publishable key — still
 * RLS-enforced; the user's session (from cookies) determines access.
 *
 * Next 16: `cookies()` is ASYNC, so this is an async factory — always
 * `await createClient()`. See node_modules/next/dist/docs (AGENTS.md).
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/lib/database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function createClient() {
  if (!url || !publishableKey) {
    throw new Error(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing. ' +
        'Copy .env.example to .env.local and fill in the public keys.',
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where the cookie store is
          // read-only. Safe to ignore when middleware refreshes the session.
        }
      },
    },
  });
}
