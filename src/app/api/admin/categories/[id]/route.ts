/**
 * PATCH /api/admin/categories/[id] — update a category (admin only).
 * DELETE /api/admin/categories/[id] — delete a category (admin only), blocked
 * if it has subcategories or listings still pointing at it.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { UpdateCategoryRequest } from '@/lib/api';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await gateStaff('admin');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const req = (await request.json()) as UpdateCategoryRequest;
    const repos = createAdminRepositories();
    const category = await repos.categories.update({ actorId: gate.staff.id, id, req });
    return Response.json(category);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const gate = await gateStaff('admin');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    await repos.categories.remove({ actorId: gate.staff.id, id });
    return new Response(null, { status: 204 });
  } catch (e) {
    return errorResponse(e);
  }
}
