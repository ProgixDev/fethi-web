/**
 * GET /api/admin/listings/moderation — the moderation queue: listings needing
 * staff attention (DRAFT/PAUSED/ARCHIVED today; reported listings once WEB-008
 * `reports` lands). Staff-gated, service-role read. Behind `listingsApi`.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { ListingStatus } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('moderator');
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const repos = createAdminRepositories();
    return Response.json(
      await repos.listings.moderationQueue({
        status: (sp.get('status') as ListingStatus | null) ?? undefined,
        page: num(sp.get('page')),
        size: num(sp.get('size')),
      }),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
