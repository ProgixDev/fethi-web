/**
 * Browser Supabase client (admin app).
 *
 * Anon/publishable key only — RLS-enforced, session persisted in cookies via
 * `@supabase/ssr`. Use in Client Components. Server Components / Route Handlers
 * use `./server`. Staff operations that need elevated access use `./admin`
 * (server-only).
 *
 * Screens never import this directly — data access goes through the repository
 * layer behind the `src/lib/api.ts` seam. See `./README.md`.
 */
import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing. ' +
      'Copy .env.example to .env.local and fill in the public keys.',
  );
}

export function createClient() {
  return createBrowserClient<Database>(url!, publishableKey!);
}
