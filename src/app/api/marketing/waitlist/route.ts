import { NextResponse, type NextRequest } from "next/server";

// PUBLIC marketing waitlist endpoint — POST /api/marketing/waitlist
//
// This is the ONLY public, unauthenticated route handler in the app. It is
// deliberately NOT staff-gated and does NOT touch the admin backend.
//
// PERSISTENCE IS DEFERRED:
// TODO(SCR): persist to a `waitlist` table (public-insert/staff-read RLS) once
// an SCR ships — see WEB-015 Coordination. There is no `waitlist` table today
// and WEB-015 explicitly allows the no-SCR path, so this handler must NOT write
// to Supabase / call `.from("waitlist")`. It validates, guards against obvious
// spam + self-referral + (best-effort, in-process) duplicates, and returns a
// success shape the form consumes. When the SCR lands, swap the stub below for
// a service-role insert with RLS (public insert, staff read) + IP/email rate
// limiting and dedup-by-email.

export const runtime = "nodejs";
// Never cache a mutation endpoint.
export const dynamic = "force-dynamic";

// Best-effort in-process dedupe. NOT a substitute for the deferred `waitlist`
// table — it only survives within a single running server process and is reset
// on redeploy/restart. Bounded to avoid unbounded memory growth from spam.
const seenEmails = new Set<string>();
const SEEN_MAX = 5_000;

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

  // --- Duplicate guard (best-effort, in-process) -----------------------------
  const duplicate = seenEmails.has(email);
  if (!duplicate) {
    if (seenEmails.size >= SEEN_MAX) seenEmails.clear();
    seenEmails.add(email);
  }

  // TODO(SCR): persist to a `waitlist` table (public-insert/staff-read RLS)
  // once an SCR ships — see WEB-015 Coordination. No DB write happens here.

  return NextResponse.json(
    {
      ok: true as const,
      duplicate,
      email,
      referralCode: attributedReferral,
      source,
    },
    { status: duplicate ? 200 : 201 },
  );
}
