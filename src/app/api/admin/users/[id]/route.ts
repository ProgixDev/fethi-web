/**
 * GET /api/admin/users/[id] — a single user's public profile for the detail
 * screen. Staff-gated; reads via the service-role client so staff can view any
 * user (RLS scopes `profiles` to the owner). Behind the `publicUsersApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const repos = createAdminRepositories();
    // `?view=admin` returns the AdminUserListItem (with status/kyc) the detail
    // moderation panel needs; default returns the PublicProfile shape.
    if (request.nextUrl.searchParams.get('view') === 'admin') {
      const item = await repos.users.getAdmin(id);
      if (!item) {
        return Response.json({ code: 'NOT_FOUND', message: 'Utilisateur introuvable.' }, { status: 404 });
      }
      return Response.json(item);
    }
    const profile = await repos.users.getPublic(id);
    if (!profile) {
      return Response.json({ code: 'NOT_FOUND', message: 'Utilisateur introuvable.' }, { status: 404 });
    }
    return Response.json(profile);
  } catch (e) {
    return errorResponse(e);
  }
}
