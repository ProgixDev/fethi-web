// didit-webhook — signature-verified Didit identity-verification webhook
// receiver (issue #28). See docs/db/decisions/SCR-020.md for the full
// design record; this comment covers behavior only.
//
// POST (Didit → Edge Function). Auth: HMAC signature (no user JWT,
// verify_jwt=false — self-verified, same pattern as stripe-webhook /
// revenuecat-webhook).
//
// Signature verification (https://docs.didit.me/integration/webhooks):
//   1. X-Timestamp must be within 300s of now.
//   2. Try X-Signature-V2 — HMAC-SHA256 over sorted, Unicode-preserved,
//      compact-separator canonical JSON of the parsed body. Algorithm
//      confirmed against Didit's own docs (Node.js reference), not guessed:
//      recursively sort object keys (code-point order), no whitespace,
//      preserve unicode. JS numbers don't distinguish 100.0 from 100 (unlike
//      Python/PHP), so the "shorten whole-valued floats" step Didit's other
//      SDKs need is already a no-op here after JSON.parse.
//   3. Fall back to X-Signature — HMAC-SHA256 over the RAW request bytes.
//      Provably correct in this runtime: Deno's req.text() returns the exact
//      wire bytes, no re-encoding, which is exactly the precondition Didit's
//      own docs require for this variant to be trustworthy.
//   4. Fall back to X-Signature-Simple — HMAC over
//      "{timestamp}:{session_id}:{status}:{webhook_type}" only. Does NOT
//      authenticate the `decision` object. If this is the ONLY method that
//      verifies, the event is still processed (better than dropping a real
//      notification) but flagged signature_method:'simple' in the log for
//      review — this function does not re-fetch the decision from Didit's
//      API to re-authenticate it (that would need a session-level Didit API
//      call this function doesn't otherwise make; a known limitation, not an
//      oversight).
//   Constant-time comparison throughout.
//
// Idempotency: every delivery attempt is logged to didit_webhook_events
// (verified or not — raw_body always stored, for debugging signature
// failures per spec). Before processing, skip (log-only, 200) if a prior
// signature_valid + processed row already exists for this event_id — a
// read-before-write check, not a DB unique constraint, because Didit's own
// retry policy redelivers the same event_id up to twice and each attempt
// still needs its own logged row (see SCR-020 "Why").
//
// profiles.kyc_status mapping (keeps the existing 4-value enum — see
// SCR-020): Approved→VERIFIED, Declined→REJECTED, In Review/In
// Progress/Resubmitted/Awaiting User→PENDING, Not Started/Abandoned/Expired/Kyc
// Expired→UNVERIFIED. On Approved, also persists kyc_session_id +
// kyc_decision for staff review depth.
//
// Correlating a webhook to a profile: `vendor_data` is expected to carry our
// `profiles.id` (the convention the not-yet-built session-creation half of
// #28 must follow when calling POST /v3/session/). A webhook whose
// vendor_data isn't a resolvable profile id is logged and acknowledged
// (200) but does not fail the delivery — Didit's retry policy exists for
// transient failures, not for "we don't recognize this user."
//
// Event families handled: status.updated, data.updated,
// user.status.updated, user.data.updated (identity verification — this
// app's actual use case). business.*, activity.created, transaction.* are
// KYB/AML-monitoring event families this app has no business/transaction
// tables for — logged and acknowledged (200), not processed. Out of scope
// for issue #28 (identity verification only), not an oversight.
//
// Explicitly NOT implemented in this version (v1 scope — flagging so
// they're not assumed covered):
//   - Resubmitted: kyc_status → PENDING happens, but per-feature-node
//     reopening (resubmit_info) does not — this app has no workflow-graph/
//     node state storage yet.
//   - Abandoned: kyc_status → UNVERIFIED happens; the spec's "optionally
//     trigger reminder" is not wired to any notification.
import { corsHeaders, json } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/supabase.ts";

const DIDIT_WEBHOOK_SECRET = Deno.env.get("DIDIT_WEBHOOK_SECRET");
const TIMESTAMP_TOLERANCE_SECONDS = 300;

const KYC_MAP: Record<
  string,
  "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"
> = {
  Approved: "VERIFIED",
  Declined: "REJECTED",
  "In Review": "PENDING",
  "In Progress": "PENDING",
  Resubmitted: "PENDING",
  "Awaiting User": "PENDING",
  "Not Started": "UNVERIFIED",
  Abandoned: "UNVERIFIED",
  Expired: "UNVERIFIED",
  "Kyc Expired": "UNVERIFIED",
  "KYC Expired": "UNVERIFIED",
};

const IDENTITY_WEBHOOK_TYPES = new Set([
  "status.updated",
  "data.updated",
  "user.status.updated",
  "user.data.updated",
]);

// --- signature verification -------------------------------------------------

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time hex-string comparison (Deno has no built-in timingSafeEqual).
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Recursively sort object keys (code-point order via plain .sort(), matching
// Didit's own Node.js reference implementation exactly).
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

async function verifyV2(
  rawBody: string,
  secret: string,
  header: string,
): Promise<boolean> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }
  // JSON.stringify already produces compact separators + no whitespace; JS's
  // single number type already collapses 100.0 → 100 on parse (see header).
  const canonical = JSON.stringify(sortKeysDeep(parsed));
  const expected = await hmacSha256Hex(secret, canonical);
  return timingSafeEqualHex(expected, header.toLowerCase());
}

async function verifyRaw(
  rawBody: string,
  secret: string,
  header: string,
): Promise<boolean> {
  const expected = await hmacSha256Hex(secret, rawBody);
  return timingSafeEqualHex(expected, header.toLowerCase());
}

async function verifySimple(
  timestamp: string,
  sessionId: string,
  status: string,
  webhookType: string,
  secret: string,
  header: string,
): Promise<boolean> {
  const message = `${timestamp}:${sessionId}:${status}:${webhookType}`;
  const expected = await hmacSha256Hex(secret, message);
  return timingSafeEqualHex(expected, header.toLowerCase());
}

type VerifyResult = { valid: boolean; method: "v2" | "raw" | "simple" | null };

async function verifySignature(
  req: Request,
  rawBody: string,
  secret: string,
  envelope: { session_id?: string; status?: string; webhook_type?: string },
): Promise<VerifyResult> {
  const v2 = req.headers.get("X-Signature-V2");
  if (v2 && (await verifyV2(rawBody, secret, v2)))
    return { valid: true, method: "v2" };

  const raw = req.headers.get("X-Signature");
  if (raw && (await verifyRaw(rawBody, secret, raw)))
    return { valid: true, method: "raw" };

  const simple = req.headers.get("X-Signature-Simple");
  const timestamp = req.headers.get("X-Timestamp");
  if (
    simple &&
    timestamp &&
    envelope.session_id &&
    envelope.status &&
    envelope.webhook_type &&
    (await verifySimple(
      timestamp,
      envelope.session_id,
      envelope.status,
      envelope.webhook_type,
      secret,
      simple,
    ))
  ) {
    return { valid: true, method: "simple" };
  }

  return { valid: false, method: null };
}

// --- logging ------------------------------------------------------------

async function logAttempt(
  svc: ReturnType<typeof serviceClient>,
  row: {
    event_id: string | null;
    session_id: string | null;
    webhook_type: string | null;
    status: string | null;
    signature_method: string | null;
    signature_valid: boolean;
    raw_body: string;
    processed: boolean;
    error: string | null;
  },
): Promise<void> {
  const { error } = await svc.from("didit_webhook_events").insert(row);
  if (error)
    console.error("didit_webhook_events insert failed:", error.message);
}

// --- handler --------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // Unconfigured → 503, kept OUT of the try below so it can't be masked as a
  // generic 500 (same pattern as stripe-webhook/revenuecat-webhook). The
  // destination secret doesn't exist until this function is deployed and its
  // URL is registered in the Didit console — expected to be 503 initially.
  if (!DIDIT_WEBHOOK_SECRET) {
    return json({ error: "didit_unconfigured" }, 503);
  }

  const svc = serviceClient();
  // Read the raw body as TEXT first — never parse JSON before signature
  // verification (needed for the raw-bytes X-Signature variant, and to avoid
  // any re-encoding drift breaking every signature method).
  const rawBody = await req.text();

  try {
    const timestampHeader = req.headers.get("X-Timestamp");
    if (!timestampHeader) {
      await logAttempt(svc, {
        event_id: null,
        session_id: null,
        webhook_type: null,
        status: null,
        signature_method: null,
        signature_valid: false,
        raw_body: rawBody,
        processed: false,
        error: "missing_timestamp",
      });
      return json({ error: "missing_timestamp" }, 400);
    }
    const timestamp = Number(timestampHeader);
    const now = Math.floor(Date.now() / 1000);
    if (
      !Number.isFinite(timestamp) ||
      Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_SECONDS
    ) {
      await logAttempt(svc, {
        event_id: null,
        session_id: null,
        webhook_type: null,
        status: null,
        signature_method: null,
        signature_valid: false,
        raw_body: rawBody,
        processed: false,
        error: "stale_timestamp",
      });
      return json({ error: "stale_timestamp" }, 400);
    }

    // Best-effort envelope parse for the Simple-signature fallback's message
    // construction — a parse failure here just means Simple can't be tried;
    // V2/raw verification below re-parses/re-reads independently.
    let envelope: Record<string, unknown> = {};
    try {
      envelope = JSON.parse(rawBody);
    } catch {
      // handled below — verifyV2 will also fail to parse and report invalid.
    }
    const eventId =
      typeof envelope.event_id === "string" ? envelope.event_id : null;
    const sessionId =
      typeof envelope.session_id === "string" ? envelope.session_id : null;
    const status = typeof envelope.status === "string" ? envelope.status : null;
    const webhookType =
      typeof envelope.webhook_type === "string" ? envelope.webhook_type : null;

    const { valid, method } = await verifySignature(
      req,
      rawBody,
      DIDIT_WEBHOOK_SECRET,
      {
        session_id: sessionId ?? undefined,
        status: status ?? undefined,
        webhook_type: webhookType ?? undefined,
      },
    );

    if (!valid) {
      await logAttempt(svc, {
        event_id: eventId,
        session_id: sessionId,
        webhook_type: webhookType,
        status,
        signature_method: null,
        signature_valid: false,
        raw_body: rawBody,
        processed: false,
        error: "invalid_signature",
      });
      return json({ error: "invalid_signature" }, 401);
    }

    // Idempotency: skip reprocessing (but still log this attempt) if a prior
    // verified+processed row already exists for this event_id.
    if (eventId) {
      const { data: already } = await svc
        .from("didit_webhook_events")
        .select("id")
        .eq("event_id", eventId)
        .eq("signature_valid", true)
        .eq("processed", true)
        .limit(1)
        .maybeSingle();
      if (already) {
        await logAttempt(svc, {
          event_id: eventId,
          session_id: sessionId,
          webhook_type: webhookType,
          status,
          signature_method: method,
          signature_valid: true,
          raw_body: rawBody,
          processed: false,
          error: "duplicate_skipped",
        });
        return json({ received: true, duplicated: true }, 200);
      }
    }

    let processError: string | null = null;
    try {
      await processEvent(svc, envelope, { webhookType, status });
    } catch (err) {
      processError = err instanceof Error ? err.message : String(err);
      console.error("didit-webhook processing error:", processError);
    }

    await logAttempt(svc, {
      event_id: eventId,
      session_id: sessionId,
      webhook_type: webhookType,
      status,
      signature_method: method,
      signature_valid: true,
      raw_body: rawBody,
      processed: processError === null,
      error: processError,
    });

    // Return 2xx even on a processing error we've already logged: Didit
    // retries on 5xx/404, and a retry would hit the SAME event_id — since
    // idempotency only skips on processed:true, a genuine transient failure
    // here is naturally retried by the NEXT delivery attempt without us
    // needing to fail this HTTP response. Only signature/timestamp failures
    // return non-2xx (those are never going to succeed on retry anyway).
    return json({ received: true }, 200);
  } catch (err) {
    console.error("didit-webhook error:", err);
    return json({ error: "webhook_error" }, 500);
  }
});

async function processEvent(
  svc: ReturnType<typeof serviceClient>,
  envelope: Record<string, unknown>,
  {
    webhookType,
    status,
  }: { webhookType: string | null; status: string | null },
): Promise<void> {
  if (!webhookType || !IDENTITY_WEBHOOK_TYPES.has(webhookType)) {
    // KYB/business/activity/transaction event families — this app has no
    // business/transaction tables to update. Acknowledged, not processed.
    return;
  }
  if (!status) return;

  const vendorData = envelope.vendor_data;
  const profileId = typeof vendorData === "string" ? vendorData : null;
  if (!profileId) {
    console.warn(
      "didit-webhook: no resolvable vendor_data (profile id) on event, skipping",
    );
    return;
  }

  const kycStatus = KYC_MAP[status];
  if (!kycStatus) {
    console.warn(`didit-webhook: unmapped status "${status}", skipping`);
    return;
  }

  const patch: Record<string, unknown> = { kyc_status: kycStatus };
  const sessionId = envelope.session_id;
  if (typeof sessionId === "string") patch.kyc_session_id = sessionId;
  // decision is present on Approved/Declined/In Review/Abandoned per Didit's
  // spec — persist whenever present, not just on Approved, so a Declined
  // decision's warnings are available for staff review too.
  if (envelope.decision !== undefined) {
    patch.kyc_decision = envelope.decision;
  }

  const { error } = await svc
    .from("profiles")
    .update(patch)
    .eq("id", profileId);
  if (error) throw new Error(`profiles update failed: ${error.message}`);
}
