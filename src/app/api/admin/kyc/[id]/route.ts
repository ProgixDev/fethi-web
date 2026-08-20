/**
 * GET /api/admin/kyc/[id] — staff-gated, detailed KYC info for a single user.
 * Includes Stripe Connect requirements and account state.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await gateStaff('moderator', 'finance');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const repos = createAdminRepositories();
    const detail = await repos.kyc.getDetail(id);
    if (!detail) {
      return Response.json(
        { code: 'NOT_FOUND', message: 'Utilisateur non trouvé' },
        { status: 404 },
      );
    }
    return Response.json(detail);
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * POST /api/admin/kyc/[id]/refresh — refresh KYC status from Stripe.
 * Calls the kyc-status Edge Function to fetch fresh data.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await gateStaff('moderator', 'finance');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.action === 'refresh') {
      const repos = createAdminRepositories();
      const detail = await repos.kyc.refreshStatus(id);
      return Response.json(detail);
    }

    if (body.action === 'resend-onboarding') {
      // NOT IMPLEMENTABLE as a staff-initiated call: the `connect-onboarding`
      // Edge Function authenticates via `requireUser(req)`, which resolves the
      // caller's OWN Supabase session from the forwarded bearer token — it has
      // no service-role / on-behalf-of path. Staff never hold the seller's JWT,
      // so there is no token this route handler could forward that would pass
      // that check (this previously sent `Bearer undefined` — a broken publishable
      // key wouldn't have fixed it either, since it still isn't a user session).
      // Fixing this for real means adding a service-role branch to the shared
      // Edge Function (fethi-web is the DB/Edge Function owner per
      // docs/db/COORDINATION.md) — out of scope here. No UI currently calls this
      // action (grep confirmed), so failing clearly beats a silent 401.
      return Response.json(
        {
          code: 'NOT_SUPPORTED',
          message:
            "Le renvoi du lien d'onboarding depuis l'admin n'est pas encore pris en charge — la fonction Stripe Connect exige la session du vendeur lui-même.",
        },
        { status: 501 },
      );
    }

    return Response.json(
      { code: 'INVALID_ACTION', message: 'Action non reconnue' },
      { status: 400 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
