/**
 * GET /api/admin/analytics/users/summary — staff-gated headline user KPIs.
 * Read-only SERVICE-ROLE aggregation over `profiles` (cross-user counts RLS
 * withholds from the browser). Optional `?from=&to=` date range. Behind the
 * `analyticsApi.summary` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.usersSummary(analyticsRange(request.nextUrl.searchParams));
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
