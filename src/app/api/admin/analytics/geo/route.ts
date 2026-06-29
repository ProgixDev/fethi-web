/**
 * GET /api/admin/analytics/geo — staff-gated geographic distribution (users and
 * listings per neighborhood). Read-only SERVICE-ROLE aggregation over `profiles`
 * + `listings`. Optional `?from=&to=`. Behind the `analyticsApi.geo` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.geoSummary(analyticsRange(request.nextUrl.searchParams));
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
