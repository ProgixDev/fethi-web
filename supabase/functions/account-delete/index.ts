// account-delete — in-app account deletion orchestration (Apple 5.1.1(v)).
//
// POST /me/deletion   body { reason? }      (mobile meApi.requestDeletion)
// Auth: user JWT.
//
// Behaviour:
//   - Blocks if the caller has an ACTIVE order or OPEN dispute on EITHER side
//     (→ 409 { code: 'DELETION_BLOCKED' } — the mobile client relays this code
//     to show "règle d'abord tes ventes en cours").
//   - Otherwise anonymises the profile PII, archives the caller's listings,
//     stamps profiles.deleted_at, and BANS the auth user so a still-valid JWT
//     can't keep acting and no new session can be minted.
//
// Runs SERVICE ROLE: RLS + the user's own grants cannot anonymise
// counterparty-visible data, and (per the Supabase security checklist) deleting
// an auth user does not invalidate already-issued access tokens — so the ban is
// the server-side enforcement, the tombstone is the durable marker.
//
// The profile ROW is kept (not hard-deleted): orders.buyer_id/seller_id are
// ON DELETE RESTRICT and historical orders must still resolve a counterparty.
// A later scheduled hard-purge of fully-aged accounts is a follow-up (the
// response shape already allows { status: 'SCHEDULED' }).
//
// Idempotent: re-calling on an already-tombstoned account returns DELETED.
//
// Error bodies are { code, message } to match the mobile client's throwApiError.
import { corsHeaders, json } from "../_shared/cors.ts";
import { HttpError, requireUser, serviceClient } from "../_shared/supabase.ts";

const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY");
const DIDIT_API_BASE = "https://verification.didit.me";

// Orders that are still "in flight" — deletion must wait until they settle.
// COMPLETED / CANCELLED / REFUNDED are terminal and do NOT block.
const ACTIVE_ORDER_STATUSES = [
  "AWAITING_PICKUP",
  "HANDOFF_PENDING",
  "DISPUTED",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ code: "METHOD_NOT_ALLOWED", message: "POST only" }, 405);
  }

  try {
    const user = await requireUser(req);
    const svc = serviceClient();

    // Idempotency: already tombstoned → converge (a retry must not error).
    const { data: prof, error: pErr } = await svc
      .from("profiles")
      .select("id, deleted_at, kyc_session_id")
      .eq("id", user.id)
      .maybeSingle();
    if (pErr) throw new HttpError(500, pErr.message);
    if (!prof || prof.deleted_at) return json({ status: "DELETED" }, 200);

    // Block on active orders / open disputes on either side.
    const { data: active, error: aErr } = await svc
      .from("orders")
      .select("id")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .in("status", ACTIVE_ORDER_STATUSES)
      .limit(1);
    if (aErr) throw new HttpError(500, aErr.message);
    if (active && active.length > 0) {
      return json(
        {
          code: "DELETION_BLOCKED",
          message:
            "Tu as une commande en cours ou un litige ouvert. Règle-le avant de supprimer ton compte.",
        },
        409,
      );
    }

    // Unlimited retention is configured in Didit, so there is no provider-side
    // automatic expiry to rely on. Delete the external KYC session before
    // tombstoning the local account. A provider failure stops the operation so
    // we never tell the user their account data was deleted when their identity
    // documents are still retained by our processor.
    if (prof.kyc_session_id) {
      if (!DIDIT_API_KEY) {
        throw new HttpError(503, "Didit deletion is not configured");
      }

      const diditResponse = await fetch(
        `${DIDIT_API_BASE}/v3/session/${prof.kyc_session_id}/delete/`,
        { method: "DELETE", headers: { "x-api-key": DIDIT_API_KEY } },
      );
      if (!diditResponse.ok && diditResponse.status !== 404) {
        console.error("Didit session deletion failed:", diditResponse.status);
        throw new HttpError(
          502,
          "Identity verification data could not be deleted",
        );
      }
    }

    const nowIso = new Date().toISOString();

    // Anonymise PII + tombstone. (email/phone live in auth.users, scrubbed by the
    // ban below + a later hard-purge; profiles holds the public-facing PII.)
    const { error: anonErr } = await svc
      .from("profiles")
      .update({
        display_name: "Utilisateur supprimé",
        avatar_path: null,
        bio: null,
        age: null,
        profession: null,
        address_label: null,
        lat: null,
        lng: null,
        neighborhood: null,
        city: null,
        kyc_session_id: null,
        kyc_decision: null,
        status: "BANNED",
        deleted_at: nowIso,
      })
      .eq("id", user.id);
    if (anonErr) throw new HttpError(500, anonErr.message);

    // Pull their listings off the market (best-effort; non-fatal).
    await svc
      .from("listings")
      .update({ status: "ARCHIVED" })
      .eq("owner_id", user.id)
      .in("status", ["DRAFT", "ACTIVE", "PAUSED"]);

    // Server-side invalidation: ban the auth user (~100y). Best-effort — the
    // tombstone + anonymise above already close the account if this call fails.
    try {
      await svc.auth.admin.updateUserById(user.id, { ban_duration: "876600h" });
    } catch {
      // swallow: account is already anonymised + tombstoned
    }

    return json({ status: "DELETED" }, 200);
  } catch (err) {
    if (err instanceof HttpError) {
      const code = err.status === 401 ? "UNAUTHORIZED" : "DELETION_FAILED";
      return json({ code, message: err.message }, err.status);
    }
    return json({ code: "INTERNAL", message: "internal_error" }, 500);
  }
});
