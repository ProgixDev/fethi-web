/**
 * GET /api/admin/support/[id] — a single support ticket. Also clears the
 * staff unread counter (opening the detail view is "reading" it) —
 * fire-and-forget so a mark-read failure never breaks the fetch.
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await gateStaff('support');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    const ticket = await repos.support.get(id);
    repos.support.markReadByStaff(id).catch((e) => {
      console.error('[admin/support/[id]] markReadByStaff failed', e);
    });
    return Response.json(ticket);
  } catch (e) {
    return errorResponse(e);
  }
}
