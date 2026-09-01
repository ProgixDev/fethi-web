/**
 * GET /api/admin/support — staff-gated, paginated/filtered support ticket
 * queue. Reads via the SERVICE-ROLE client (SCR-028 gives `support_tickets`
 * no cross-user client SELECT). Behind the `supportApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { SupportTicketFilters, SupportTicketStatus } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('support');
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: SupportTicketFilters = {
      status: (sp.get('status') as SupportTicketStatus | null) ?? undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
    };
    const repos = createAdminRepositories();
    const result = await repos.support.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
