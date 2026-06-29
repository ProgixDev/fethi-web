/**
 * GET /api/admin/reports — staff-gated, server-side paginated/filtered report
 * queue. Reads via the SERVICE-ROLE client (SCR-005 gives `reports` no client
 * SELECT). Behind the `reportsApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { ReportFilters, ReportStatus, ReportTargetType } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: ReportFilters = {
      status: (sp.get('status') as ReportStatus | null) ?? undefined,
      targetType: (sp.get('targetType') as ReportTargetType | null) ?? undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
    };
    const repos = createAdminRepositories();
    const result = await repos.reports.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
