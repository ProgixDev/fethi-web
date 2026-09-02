/**
 * GET /api/admin/support/[id]/messages — thread for a ticket, oldest first.
 * POST /api/admin/support/[id]/messages — staff reply. The DB trigger
 * (`sync_ticket_on_message`, SCR-028) maintains the parent ticket's
 * `last_message*`/unread/status — this route only inserts the message.
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
    const messages = await repos.support.listMessages(id);
    return Response.json(messages);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const gate = await gateStaff('support');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const payload = (await request.json().catch(() => ({}))) as { body?: string };
    const body = payload.body?.trim();
    if (!body) {
      return Response.json(
        { code: 'INVALID_BODY', message: 'Le message ne peut pas être vide.' },
        { status: 422 },
      );
    }

    const repos = createAdminRepositories();
    const message = await repos.support.reply({
      ticketId: id,
      staffUserId: gate.staff.id,
      body,
    });
    return Response.json(message, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
