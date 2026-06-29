/**
 * PATCH /api/admin/reports/[id]/status — transition a report through
 * OPEN → REVIEWING → ACTIONED/DISMISSED.
 *
 * Staff action, requires `moderator`. The write goes to `reports.status` via the
 * SERVICE-ROLE client (no client UPDATE under SCR-005) and is audited in
 * `staff_audit_log` (SCR-004) — the optional `moderatorNote` is recorded as the
 * audit reason. Idempotent (re-applying the current status is a no-op). Behind
 * the `reportsApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { ReportStatus } from '@/lib/api';

const ALLOWED: ReportStatus[] = ['OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED'];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      moderatorNote?: string;
    };
    const next = body.status as ReportStatus | undefined;
    if (!next || !ALLOWED.includes(next)) {
      return Response.json(
        {
          code: 'INVALID_STATUS',
          message: 'Statut invalide (OPEN | REVIEWING | ACTIONED | DISMISSED).',
        },
        { status: 422 },
      );
    }

    const repos = createAdminRepositories();
    const updated = await repos.reports.setStatus({
      actorId: gate.staff.id,
      id,
      next,
      moderatorNote: body.moderatorNote ?? null,
    });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
