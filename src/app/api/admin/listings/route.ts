/**
 * GET /api/admin/listings — staff-gated, paginated/searched/filtered listing
 * list. Reads via the SERVICE-ROLE client (staff see every status/owner, not
 * just ACTIVE-or-own). Behind the `listingsApi` seam. Moderation lives in
 * `[id]/status`.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { ListingFilters, ListingStatus, ListingType } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: ListingFilters = {
      q: sp.get('q') ?? undefined,
      status: (sp.get('status') as ListingStatus | null) ?? undefined,
      listingType: (sp.get('listingType') as ListingType | null) ?? undefined,
      categoryId: sp.get('categoryId') ?? undefined,
      ownerId: sp.get('ownerId') ?? undefined,
      neighborhood: sp.get('neighborhood') ?? undefined,
      minPriceCents: num(sp.get('minPriceCents')),
      maxPriceCents: num(sp.get('maxPriceCents')),
      page: num(sp.get('page')),
      size: num(sp.get('size')),
      sort: sp.get('sort') ?? undefined,
    };
    const repos = createAdminRepositories();
    return Response.json(await repos.listings.list(filters));
  } catch (e) {
    return errorResponse(e);
  }
}
