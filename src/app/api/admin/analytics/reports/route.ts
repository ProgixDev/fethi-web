/**
 * GET /api/admin/analytics/reports — staff-gated report-queue aggregations
 * (totals, by status, by target type, per-day trend). Read-only SERVICE-ROLE
 * aggregation over `reports` (SCR-005 gives no client SELECT, so moderation
 * analytics must run service-role). Moderator-gated like the moderation queue.
 * Optional `?from=&to=`. Behind the `analyticsApi.reports` seam.
 */
import type { NextRequest } from 'next/server';

import { analyticsRange, errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const data = await repos.analytics.reportsSummary(analyticsRange(request.nextUrl.searchParams));
    return Response.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
