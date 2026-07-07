// notifications-dispatch — stores in-app notifications and fans out Expo push.
//
// POST /notifications-dispatch
// Auth: SERVICE ROLE only. The caller must present
//   `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`. This is a server-to-server
//   function invoked by other Edge Functions / trusted backends on domain events
//   (message / offer / order / …); it is NOT meant to be called by end-user JWTs,
//   because it can write a notification to ANY user. supabase.functions.invoke()
//   always issues a POST, so POST is the only accepted method.
//
// Body (JSON):
//   {
//     userId?: string,          // single recipient
//     userIds?: string[],       // OR fan-out to many recipients
//     kind: NotifKind,          // one of the 8 mobile NotifKind values
//     title: string,
//     body?: string | null,
//     href?: string | null,
//     data?: Record<string, unknown>   // extra push payload (merged into Expo data)
//   }
//
// Behaviour:
//   1. Insert one in-app `notifications` row per recipient (service role). This
//      always happens, even if the user has no push tokens or push is denied on
//      the device — the in-app feed is never dropped.
//   2. Load each recipient's `device_push_tokens` and batch-send Expo push
//      (chunked at 100, the Expo API limit).
//   3. Prune tokens whose ticket reports "DeviceNotRegistered".
//
// Edge cases:
//   - EXPO secret missing → 503 (unconfigured, not a generic 500). Checked before
//     any DB write so a misconfigured deploy doesn't insert unpushable rows.
//   - Recipient has no tokens → 200, { pushed: false } (still stored in-app).
//   - Duplicate device rows → handled at the DB by unique(user_id, token) upsert.
import { corsHeaders, json } from '../_shared/cors.ts';
import { serviceClient } from '../_shared/supabase.ts';

const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// Server-only Expo secret. NEVER NEXT_PUBLIC_/EXPO_PUBLIC_ — Edge secret only.
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_CHUNK_SIZE = 100;

const NOTIF_KINDS = [
  'MESSAGE',
  'OFFER',
  'BOOKING_REQUEST',
  'LISTING_SOLD',
  'ORDER_UPDATE',
  'REVIEW',
  'PAYOUT',
  'SYSTEM',
] as const;
type NotifKind = (typeof NOTIF_KINDS)[number];

type DispatchBody = {
  userId?: string;
  userIds?: string[];
  kind?: string;
  title?: string;
  body?: string | null;
  href?: string | null;
  data?: Record<string, unknown>;
};

type ExpoMessage = {
  to: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // Unconfigured push provider → 503 (not 500). Kept OUT of the try below and
  // BEFORE any DB write so a misconfigured deploy never stores unpushable rows.
  if (!EXPO_ACCESS_TOKEN) {
    return json({ error: 'push_unconfigured' }, 503);
  }
  if (!SERVICE_ROLE_KEY) {
    return json({ error: 'service_unconfigured' }, 503);
  }

  try {
    // --- Auth: service-role bearer only ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!bearer || bearer !== SERVICE_ROLE_KEY) {
      return json({ error: 'unauthorized' }, 401);
    }

    // --- Parse + validate body ---
    let payload: DispatchBody;
    try {
      payload = await req.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    const recipients = Array.from(
      new Set(
        [
          ...(payload.userId ? [payload.userId] : []),
          ...(Array.isArray(payload.userIds) ? payload.userIds : []),
        ].filter((u): u is string => typeof u === 'string' && u.length > 0),
      ),
    );

    if (recipients.length === 0) {
      return json({ error: 'no_recipients' }, 400);
    }
    if (!payload.kind || !NOTIF_KINDS.includes(payload.kind as NotifKind)) {
      return json({ error: 'invalid_kind' }, 400);
    }
    if (!payload.title || typeof payload.title !== 'string') {
      return json({ error: 'missing_title' }, 400);
    }

    const kind = payload.kind as NotifKind;
    const title = payload.title;
    const body = typeof payload.body === 'string' ? payload.body : null;
    const href = typeof payload.href === 'string' ? payload.href : null;
    const extraData = payload.data && typeof payload.data === 'object' ? payload.data : {};

    const svc = serviceClient();

    // --- 1. Store in-app notifications (always, regardless of push outcome) ---
    const rows = recipients.map((user_id) => ({ user_id, kind, title, body, href }));
    const { data: inserted, error: insertErr } = await svc
      .from('notifications')
      .insert(rows)
      .select('id, user_id');

    if (insertErr) {
      console.error('notifications insert failed:', insertErr);
      return json({ error: 'store_failed' }, 500);
    }

    const notifIds = (inserted ?? []).map((r) => r.id);

    // --- 2. Load recipients' push tokens ---
    const { data: tokenRows, error: tokenErr } = await svc
      .from('device_push_tokens')
      .select('token, user_id')
      .in('user_id', recipients);

    if (tokenErr) {
      console.error('device_push_tokens read failed:', tokenErr);
      // In-app is already stored; report partial success.
      return json({ stored: true, notifIds, pushed: false, reason: 'token_read_failed' }, 200);
    }

    if (!tokenRows || tokenRows.length === 0) {
      return json({ stored: true, notifIds, pushed: false, reason: 'no_tokens' }, 200);
    }

    // Map each Expo push token back to its owning user (for pruning).
    const tokenToUser = new Map<string, string>();
    for (const r of tokenRows) tokenToUser.set(r.token, r.user_id);

    const messages: ExpoMessage[] = tokenRows.map((r) => ({
      to: r.token,
      title,
      ...(body ? { body } : {}),
      data: { kind, href, notifIds, ...extraData },
    }));

    // --- 3. Batch send to Expo (chunked at the 100-message API limit) ---
    let sent = 0;
    const deadTokens: string[] = [];

    for (const batch of chunk(messages, EXPO_CHUNK_SIZE)) {
      let resp: Response;
      try {
        resp = await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(batch),
        });
      } catch (err) {
        console.error('Expo push request failed:', err);
        continue;
      }

      if (!resp.ok) {
        console.error(`Expo push HTTP ${resp.status}:`, await resp.text());
        continue;
      }

      const result = (await resp.json()) as { data?: ExpoTicket[] };
      const tickets = result.data ?? [];

      // Tickets come back in the SAME order as the batch we sent.
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'ok') {
          sent += 1;
        } else if (ticket.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(batch[i].to);
        } else {
          console.error('Expo push ticket error:', ticket.message, ticket.details);
        }
      });
    }

    // --- Prune dead tokens (globally — a DeviceNotRegistered token is dead) ---
    let pruned = 0;
    if (deadTokens.length > 0) {
      const { error: pruneErr, count } = await svc
        .from('device_push_tokens')
        .delete({ count: 'exact' })
        .in('token', deadTokens);
      if (pruneErr) {
        console.error('token prune failed:', pruneErr);
      } else {
        pruned = count ?? 0;
      }
    }

    return json({ stored: true, notifIds, pushed: true, sent, pruned }, 200);
  } catch (err) {
    console.error('notifications-dispatch error:', err);
    return json({ error: 'dispatch_error' }, 500);
  }
});
