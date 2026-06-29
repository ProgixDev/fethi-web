/**
 * GET /api/admin/analytics/users/by-neighborhood — staff-gated top neighborhoods
 * by user count. Read-only SERVICE-ROLE aggregation over `profiles`. Optional
 * `?from=&to=`. Behind the `analyticsApi.byNeighborhood` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.usersByNeighborhood(
      analyticsRange(request.nextUrl.searchParams),
    );
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
