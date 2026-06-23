/** GET /api/admin/listings/[id] — single listing detail (staff-gated, service-role). */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    const listing = await repos.listings.get(id);
    if (!listing) {
      return Response.json({ code: 'NOT_FOUND', message: 'Annonce introuvable.' }, { status: 404 });
    }
    return Response.json(listing);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    await repos.listings.archive({ actorId: gate.staff.id, id });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
