/**
 * PATCH /api/admin/listings/[id]/status — moderate a listing (pause / archive /
 * restore / soft-hide). Staff action requiring `moderator` (or `admin`). The
 * write goes via the SERVICE-ROLE client (cross-owner mutation) and is audited
 * (SCR-004) with the prior status so it is reversible. Behind `listingsApi`.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { ListingStatus } from '@/lib/api';

const ALLOWED: ListingStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD', 'ARCHIVED'];

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
    const next = body.status as ListingStatus | undefined;
    if (!next || !ALLOWED.includes(next)) {
      return Response.json(
        { code: 'INVALID_STATUS', message: 'Statut invalide.' },
        { status: 422 },
      );
    }

    const repos = createAdminRepositories();
    const updated = await repos.listings.setStatus({
      actorId: gate.staff.id,
      id,
      next,
      reason: body.reason ?? null,
    });
    return Response.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
