/**
 * GET /api/admin/users — staff-gated, server-side paginated/searched/filtered
 * user list. Reads via the SERVICE-ROLE client (staff need cross-user visibility
 * that RLS on `profiles` withholds). Behind the `usersApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { UserFilters } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: UserFilters = {
      q: sp.get('q') ?? undefined,
      status: sp.get('status') ?? undefined,
      kyc: sp.get('kyc') ?? undefined,
      neighborhood: sp.get('neighborhood') ?? undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
      sort: sp.get('sort') ?? undefined,
    };
    const repos = createAdminRepositories();
    const result = await repos.users.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
