/**
 * GET /api/admin/analytics/engagement — staff-gated engagement aggregations
 * (messages, threads, offers, favorites, saved searches + signup & message
 * trends). Read-only SERVICE-ROLE aggregation over those tables. Optional
 * `?from=&to=`. Behind the `analyticsApi.engagement` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.engagementSummary(
      analyticsRange(request.nextUrl.searchParams),
    );
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
