/**
 * GET /api/admin/audit — staff-gated, server-side paginated read of the real
 * `staff_audit_log` trail (SCR-004), newest first. Admin-only, mirroring the
 * `/settings` sidebar gate. Behind the `auditApi.list` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { AuditFilters, AuditTargetType } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('admin');
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: AuditFilters = {
      targetType: (sp.get('targetType') as AuditTargetType | null) ?? undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
    };
    const repos = createAdminRepositories();
    const result = await repos.audit.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
