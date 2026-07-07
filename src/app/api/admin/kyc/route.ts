/**
 * GET /api/admin/kyc — staff-gated, server-side paginated KYC list.
 * Reads from `profiles` + `payout_accounts` to show Stripe Connect status.
 * Behind the `kycApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { KycFilters } from '@/lib/repositories';
import type { KycStatus } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('moderator', 'finance');
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: KycFilters = {
      q: sp.get('q') ?? undefined,
      status: (sp.get('status') ?? undefined) as KycStatus | undefined,
      source: sp.get('source') as 'connect' | 'profile' | 'none' | undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
      sort: sp.get('sort') ?? undefined,
    };
    const repos = createAdminRepositories();
    const result = await repos.kyc.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
