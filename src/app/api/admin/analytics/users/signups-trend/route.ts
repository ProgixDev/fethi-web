/**
 * GET /api/admin/analytics/users/signups-trend — staff-gated per-day signup
 * trend. Read-only SERVICE-ROLE aggregation over `profiles.created_at`. Optional
 * `?from=&to=` (defaults to the last 30 days). Behind `analyticsApi.signupsTrend`.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.signupsTrend(analyticsRange(request.nextUrl.searchParams));
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
