// didit-session-create — start (or resume) a Didit identity-verification
// session for the authenticated user (issue #28).
//
// POST { callback?, callbackMethod?, language? }   (mobile diditApi.startVerification)
// Auth: user JWT (the person being verified)
// Returns: { url, sessionId, status }
//
// Didit handles idempotency itself: when `vendor_data` is provided and an
// unfinished session already exists for that value on the workflow's latest
// published version, Didit returns the EXISTING session (still 201) instead
// of creating a duplicate — https://docs.didit.me/sessions-api/create-session.
// So this function does no dedup of its own; it always calls Didit and
// trusts that behavior, always passing vendor_data = the caller's profile id
// (the same convention didit-webhook already assumes when correlating a
// webhook back to a profile via vendor_data).
//
// Secrets: DIDIT_API_KEY (Business Console API key), DIDIT_WORKFLOW_ID (a
// workflow UUID configured in the Didit dashboard — determines what the
// session actually verifies: ID doc, liveness, etc.). Both required; 503
// (didit_unconfigured) if either is missing, same guard pattern as every
// other third-party-config-dependent function in this repo.
//
// This function persists profiles.kyc_session_id immediately (best-effort,
// non-fatal on failure) so a session exists in our records even if the user
// abandons before any webhook fires — didit-webhook remains the AUTHORITATIVE
// writer of kyc_status; this function never touches that column.
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, requireUser, serviceClient } from '../_shared/supabase.ts';

const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
const DIDIT_WORKFLOW_ID = Deno.env.get('DIDIT_WORKFLOW_ID');
const DIDIT_API_BASE = 'https://verification.didit.me';

type DiditSessionResponse = {
  session_id: string;
  session_number: number;
  session_token: string;
  url: string;
  vendor_data: string;
  status: string;
  workflow_id: string;
  workflow_version: number;
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
    return json({ error: 'didit_unconfigured' }, 503);
  }

  try {
    const user = await requireUser(req);
    const svc = serviceClient();
    const body = await req.json().catch(() => ({}));

    const requestBody: Record<string, unknown> = {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: user.id,
    };
    if (typeof body.callback === 'string') requestBody.callback = body.callback;
    if (typeof body.callbackMethod === 'string') requestBody.callback_method = body.callbackMethod;
    if (typeof body.language === 'string') requestBody.language = body.language;
    if (user.email) {
      requestBody.contact_details = { email: user.email, send_notification_emails: false };
    }

    const res = await fetch(`${DIDIT_API_BASE}/v3/session/`, {
      method: 'POST',
      headers: {
        'x-api-key': DIDIT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`Didit session create failed (${res.status}): ${errBody}`);
      throw new HttpError(502, 'didit_session_create_failed');
    }

    const session = (await res.json()) as DiditSessionResponse;

    // Best-effort: record which session is in flight for this user. Never
    // fatal — didit-webhook is the source of truth for status, this is just
    // staff-visibility for an abandoned/never-started session.
    const { error: updateErr } = await svc
      .from('profiles')
      .update({ kyc_session_id: session.session_id })
      .eq('id', user.id);
    if (updateErr) console.error('profiles.kyc_session_id update failed:', updateErr.message);

    return json(
      {
        url: session.url,
        sessionId: session.session_id,
        status: session.status,
      },
      201,
    );
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error('didit-session-create error:', err);
    return json({ error: 'internal_error' }, 500);
  }
});
