/**
 * GET /api/admin/users/[id]/threads — staff-gated list of a user's message
 * threads (buyer or seller side), newest activity first. Reads via the
 * service-role client since `threads`/`messages` RLS scopes rows to the
 * participants. Behind the `messagesApi.threadsForUser` seam, used by
 * `users/[id]/messages`.
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    const threads = await repos.messages.threadsForUser(id);
    return Response.json(threads);
  } catch (e) {
    return errorResponse(e);
  }
}
