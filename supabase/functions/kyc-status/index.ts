// kyc-status — read the caller's Didit identity status and the independent
// Stripe payout capability (issue #28 / SCR-022).
//
// GET /me/kyc-status    (auth: user JWT)
// → { status, providerStatus, canRetry, source, payoutsEnabled }
//
// Identity and payouts are deliberately separate: profiles.kyc_status is owned
// by the signed Didit webhook, while payout_accounts only supplies the boolean
// payoutsEnabled. The latest verified webhook status preserves actionable Didit
// states (Expired/Abandoned/Resubmitted) without widening the shared DB enum.
//
// Error bodies are { code, message } to match the mobile client's throwApiError.
import { corsHeaders, json } from "../_shared/cors.ts";
import { HttpError, requireUser, serviceClient } from "../_shared/supabase.ts";

type KycStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";

const RETRY_STATUSES = new Set([
  "Declined",
  "Expired",
  "Abandoned",
  "Kyc Expired",
  "KYC Expired",
  "Resubmitted",
]);

function mapProviderStatus(providerStatus: string | null, stored: KycStatus): KycStatus {
  if (providerStatus === 'Approved') return 'VERIFIED';
  if (providerStatus === 'Declined') return 'REJECTED';
  if (
    providerStatus === 'Not Started' ||
    providerStatus === 'In Progress' ||
    providerStatus === 'In Review' ||
    providerStatus === 'Resubmitted' ||
    providerStatus === 'Awaiting User'
  ) {
    return 'PENDING';
  }
  if (
    providerStatus === 'Expired' ||
    providerStatus === 'Abandoned' ||
    providerStatus === 'Kyc Expired'
  ) {
    return 'UNVERIFIED';
  }
  return stored;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") {
    return json({ code: "METHOD_NOT_ALLOWED", message: "GET only" }, 405);
  }

  try {
    const user = await requireUser(req);
    const svc = serviceClient();

    // The signed Didit webhook owns these profile fields.
    const { data: prof, error: pErr } = await svc
      .from("profiles")
      .select("kyc_status, kyc_session_id")
      .eq("id", user.id)
      .maybeSingle();
    if (pErr) throw new HttpError(500, pErr.message);

    const stored = (prof?.kyc_status as string | undefined) ?? "UNVERIFIED";
    // Web stores an extra 'REVIEW' value; collapse it to the shared 'PENDING'.
    const status: KycStatus =
      stored === "VERIFIED" || stored === "PENDING" || stored === "REJECTED"
        ? (stored as KycStatus)
        : stored === "REVIEW"
          ? "PENDING"
          : "UNVERIFIED";

    let providerStatus: string | null = null;
    if (prof?.kyc_session_id) {
      const { data: event, error: eventErr } = await svc
        .from("didit_webhook_events")
        .select("status")
        .eq("session_id", prof.kyc_session_id)
        .eq("signature_valid", true)
        .eq("processed", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (eventErr) throw new HttpError(500, eventErr.message);
      providerStatus =
        event?.status === "KYC Expired"
          ? "Kyc Expired"
          : (event?.status ?? "Not Started");
    }

    // Stripe is still required for receiving money, but never overrides the
    // Didit identity result.
    const { data: payout } = await svc
      .from("payout_accounts")
      .select("payouts_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    const effectiveStatus = mapProviderStatus(providerStatus, status);

    return json(
      {
        status: effectiveStatus,
        providerStatus,
        canRetry: providerStatus ? RETRY_STATUSES.has(providerStatus) : false,
        payoutsEnabled: payout?.payouts_enabled ?? false,
        source: prof?.kyc_session_id ? "didit" : "profile",
      },
      200,
    );
  } catch (err) {
    if (err instanceof HttpError) {
      const code = err.status === 401 ? "UNAUTHORIZED" : "KYC_STATUS_FAILED";
      return json({ code, message: err.message }, err.status);
    }
    return json({ code: "INTERNAL", message: "internal_error" }, 500);
  }
});
