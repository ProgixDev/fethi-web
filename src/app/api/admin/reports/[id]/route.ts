/**
 * GET /api/admin/reports/[id] — a single report for the moderation detail
 * screen. Staff-gated, SERVICE-ROLE read (no client SELECT under SCR-005). The
 * reported target's context is resolved client-side via listingsApi /
 * publicUsersApi. Behind the `reportsApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    const report = await repos.reports.get(id);
    return Response.json(report);
  } catch (e) {
    return errorResponse(e);
  }
}
