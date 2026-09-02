/**
 * PATCH /api/admin/support/[id]/status — transition a ticket's status.
 * Idempotent (re-applying the current status is a no-op).
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { SupportTicketStatus } from '@/lib/api';

const ALLOWED: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await gateStaff('support');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as { status?: string };
    const next = body.status as SupportTicketStatus | undefined;
    if (!next || !ALLOWED.includes(next)) {
      return Response.json(
        {
          code: 'INVALID_STATUS',
          message: 'Statut invalide (OPEN | IN_PROGRESS | RESOLVED | CLOSED).',
        },
        { status: 422 },
      );
    }

    const repos = createAdminRepositories();
    const updated = await repos.support.setStatus({ id, next });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
