/**
 * GET /api/admin/analytics/listings — staff-gated listing aggregations (counts
 * by type/status, top categories, total views/favorites). Read-only
 * SERVICE-ROLE aggregation over `listings` (+ joined `categories.label`).
 * Optional `?from=&to=`. Behind the `analyticsApi.listings` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.listingsSummary(
      analyticsRange(request.nextUrl.searchParams),
    );
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
