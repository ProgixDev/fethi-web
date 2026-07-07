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
      // Call the connect-onboarding Edge Function to generate a fresh onboarding link
      const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/connect-onboarding`;
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userId: id,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/dashboard`,
          refreshUrl: `${process.env.NEXT_PUBLIC_APP_URL}/seller/onboarding`,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return Response.json(
          { code: 'ONBOARDING_FAILED', message: error.message || 'Failed to generate onboarding link' },
          { status: response.status },
        );
      }

      const data = await response.json();
      return Response.json(data);
    }

    return Response.json(
      { code: 'INVALID_ACTION', message: 'Action non reconnue' },
      { status: 400 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
