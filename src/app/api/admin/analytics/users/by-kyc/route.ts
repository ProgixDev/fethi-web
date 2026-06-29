/**
 * GET /api/admin/analytics/users/by-kyc — staff-gated user distribution by KYC
 * status. Read-only SERVICE-ROLE aggregation over `profiles`. Optional
 * `?from=&to=` (scopes on signup date). Behind the `analyticsApi.byKyc` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.usersByKyc(analyticsRange(request.nextUrl.searchParams));
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
