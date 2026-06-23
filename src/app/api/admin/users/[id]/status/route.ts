/**
 * PATCH /api/admin/users/[id]/status — suspend / ban / reactivate a user.
 *
 * Staff action. Requires `moderator` (or `admin`). The write goes to
 * `profiles.status` via the SERVICE-ROLE client (cross-user mutation) and is
 * audited (SCR-004) in the same path — NEVER off user_metadata, NEVER from the
 * browser. Banning self is blocked. Behind the `usersApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { Database } from '@/lib/database.types';

type UserStatus = Database['public']['Enums']['user_status'];
const ALLOWED: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'BANNED'];

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await ctx.params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: string;
      reason?: string;
    };
    const next = body.status as UserStatus | undefined;
    if (!next || !ALLOWED.includes(next)) {
      return Response.json(
        { code: 'INVALID_STATUS', message: 'Statut invalide (ACTIVE | SUSPENDED | BANNED).' },
        { status: 422 },
      );
    }

    const repos = createAdminRepositories();
    const updated = await repos.users.setStatus({
      actorId: gate.staff.id,
      targetId: id,
      next,
      reason: body.reason ?? null,
    });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
