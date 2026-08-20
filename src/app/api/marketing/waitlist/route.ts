import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

// PUBLIC marketing waitlist endpoint — POST /api/marketing/waitlist
//
// This is the ONLY public, unauthenticated route handler in the app. It is
// deliberately NOT staff-gated and does NOT touch the admin backend.
//
// Persists to `public.waitlist` (SCR-017) via the service-role client — the
// table has no client RLS policies (see SCR-017.md), so this route is the
// sole writer. Validates, guards against obvious spam + self-referral, then
// inserts; a unique index on lower(email) is the real dedup, not an
// in-process Set (which never survives a redeploy on serverless anyway).

export const runtime = "nodejs";
// Never cache a mutation endpoint.
export const dynamic = "force-dynamic";

// Pragmatic RFC-5322-lite email check. Server-side validation is mandatory
// (clients can bypass the <input type="email"> guard).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REFERRAL_RE = /^[A-Za-z0-9-]{2,40}$/;

type ErrorBody = {
  code: string;
  message: string;
  fieldErrors?: { field: string; message: string }[];
};

function fail(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, { code: "INVALID_JSON", message: "Corps de requête invalide." });
  }

  if (typeof payload !== "object" || payload === null) {
    return fail(400, { code: "INVALID_BODY", message: "Corps de requête invalide." });
  }

  const body = payload as Record<string, unknown>;
  const rawEmail = typeof body.email === "string" ? body.email : "";
  const email = rawEmail.trim().toLowerCase();
  const referralRaw = typeof body.referralCode === "string" ? body.referralCode.trim() : "";
  const source = typeof body.source === "string" ? body.source.slice(0, 64) : "homepage";

  // --- Email validation -----------------------------------------------------
  if (!email) {
    return fail(400, {
      code: "EMAIL_REQUIRED",
      message: "Une adresse e-mail est requise.",
      fieldErrors: [{ field: "email", message: "Adresse e-mail requise." }],
    });
  }
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return fail(400, {
      code: "EMAIL_INVALID",
      message: "Adresse e-mail invalide.",
      fieldErrors: [{ field: "email", message: "Format d'adresse e-mail invalide." }],
    });
  }

  // --- Spam guards -----------------------------------------------------------
  // Reject obvious throwaway/test patterns and over-long referral payloads.
  if (referralRaw && !REFERRAL_RE.test(referralRaw)) {
    return fail(400, {
      code: "REFERRAL_INVALID",
      message: "Code de parrainage invalide.",
      fieldErrors: [{ field: "referralCode", message: "Code de parrainage invalide." }],
    });
  }
  const referralCode = referralRaw ? referralRaw.toUpperCase() : null;

  // --- Self-referral guard ---------------------------------------------------
  // A referral code derived from the signer's own email local-part is a
  // self-referral attempt — accept the signup but drop the attribution.
  let attributedReferral = referralCode;
  if (attributedReferral) {
    const localPart = email.split("@")[0]?.toUpperCase() ?? "";
    if (localPart && attributedReferral.includes(localPart)) {
      attributedReferral = null;
    }
  }

  // --- Persist ----------------------------------------------------------------
  const admin = createAdminClient();
  const { data: inserted, error: insertErr } = await admin
    .from("waitlist")
    .insert({ email, referral_code: attributedReferral, source })
    .select("referral_code")
    .single();

  if (insertErr) {
    // Unique violation on lower(email) => this email already signed up.
    // Return the ORIGINAL referral attribution, not the one just submitted —
    // a resubmission shouldn't be able to overwrite who gets credit.
    if (insertErr.code === "23505") {
      const { data: existing } = await admin
        .from("waitlist")
        .select("referral_code")
        .eq("email", email)
        .maybeSingle();
      return NextResponse.json(
        {
          ok: true as const,
          duplicate: true,
          email,
          referralCode: existing?.referral_code ?? null,
          source,
        },
        { status: 200 },
      );
    }
    console.error("[waitlist] insert failed", insertErr);
    return fail(500, {
      code: "INTERNAL",
      message: "Erreur interne, réessayez plus tard.",
    });
  }

  return NextResponse.json(
    {
      ok: true as const,
      duplicate: false,
      email,
      referralCode: inserted.referral_code,
      source,
    },
    { status: 201 },
  );
}
