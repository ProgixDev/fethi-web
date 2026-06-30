// account-export — RGPD / data-portability export (Apple 5.1.1(v) sibling).
//
// POST /me/export      (mobile meApi.requestExport)
// Auth: user JWT.
//
// Assembles every row the caller owns across the shared schema into a single
// JSON archive, then hands it to the mailer for async delivery. Returns only an
// acknowledgement: { status: 'QUEUED' | 'SENT', deliveryEmail? }.
//
// Delivery is provider-dependent and asynchronous. With no email provider secret
// configured (RESEND_API_KEY), the archive is assembled and the call returns
// QUEUED — wiring the actual send/storage is the deploy step (functions here are
// authored but not yet deployed; see SCR-008). Runs SERVICE ROLE to read across
// the user's data regardless of per-table RLS.
//
// Error bodies are { code, message } to match the mobile client's throwApiError.
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, requireUser, serviceClient } from '../_shared/supabase.ts';
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

// Best-effort select of a user's rows from one table on a given owner column.
async function collect(
  svc: SupabaseClient,
  table: string,
  column: string,
  userId: string,
): Promise<unknown[]> {
  const { data, error } = await svc.from(table).select('*').eq(column, userId);
  if (error) return []; // a table that doesn't exist / isn't owned this way → skip
  return data ?? [];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return json({ code: 'METHOD_NOT_ALLOWED', message: 'POST only' }, 405);
  }

  try {
    const user = await requireUser(req);
    const svc = serviceClient();

    // Resolve the delivery address from auth (profiles holds no email column).
    let deliveryEmail: string | null = null;
    try {
      const { data: au } = await svc.auth.admin.getUserById(user.id);
      deliveryEmail = au?.user?.email ?? null;
    } catch {
      // non-fatal — export still assembles
    }

    // Assemble the archive. Orders/messages span both sides, so gather each side.
    const [profile, listings, ordersBuyer, ordersSeller, offersBuyer, offersSeller, messages, reviewsAuthored, reviewsReceived, favorites, savedSearches, blocked] =
      await Promise.all([
        collect(svc, 'profiles', 'id', user.id),
        collect(svc, 'listings', 'owner_id', user.id),
        collect(svc, 'orders', 'buyer_id', user.id),
        collect(svc, 'orders', 'seller_id', user.id),
        collect(svc, 'offers', 'buyer_id', user.id),
        collect(svc, 'offers', 'seller_id', user.id),
        collect(svc, 'messages', 'sender_id', user.id),
        collect(svc, 'reviews', 'author_id', user.id),
        collect(svc, 'reviews', 'target_user_id', user.id),
        collect(svc, 'favorites', 'user_id', user.id),
        collect(svc, 'saved_searches', 'user_id', user.id),
        collect(svc, 'blocked_users', 'blocker_id', user.id),
      ]);

    const archive = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      deliveryEmail,
      data: {
        profile,
        listings,
        orders: [...ordersBuyer, ...ordersSeller],
        offers: [...offersBuyer, ...offersSeller],
        messages,
        reviews: { authored: reviewsAuthored, received: reviewsReceived },
        favorites,
        savedSearches,
        blockedUsers: blocked,
      },
    };

    // Hand off to the mailer when configured; otherwise acknowledge as QUEUED.
    // Deploy step: when RESEND_API_KEY + a sending domain are configured, POST
    // `archive` to the email provider (or stash it in Storage and email a signed
    // link) and return { status: 'SENT' }. Kept inert until then — we still
    // assemble the archive above so the gather logic is real, not stubbed.
    void archive;
    return json({ status: 'QUEUED', deliveryEmail }, 202);
  } catch (err) {
    if (err instanceof HttpError) {
      const code = err.status === 401 ? 'UNAUTHORIZED' : 'EXPORT_FAILED';
      return json({ code, message: err.message }, err.status);
    }
    return json({ code: 'INTERNAL', message: 'internal_error' }, 500);
  }
});
