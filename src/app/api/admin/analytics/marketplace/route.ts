/**
 * GET /api/admin/analytics/marketplace — staff-gated marketplace overview
 * (platform totals, GMV/fees from COMPLETED orders, orders-by-status, per-day
 * GMV trend). Read-only SERVICE-ROLE aggregation over `orders` + `profiles` +
 * `listings`. Optional `?from=&to=`. Behind the `analyticsApi.marketplace` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.marketplaceSummary(
      analyticsRange(request.nextUrl.searchParams),
    );
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
