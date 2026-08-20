/**
 * GET /api/admin/categories — staff-gated taxonomy list.
 * POST /api/admin/categories — create a category (admin only).
 * Reads/writes via the SERVICE-ROLE client (`categories` has no client write
 * policy). Behind the `categoriesApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { CategoryFilters, CreateCategoryRequest, ListingType } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: CategoryFilters = {
      type: (sp.get('type') as ListingType | null) ?? undefined,
      label: sp.get('label') ?? undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
    };
    const repos = createAdminRepositories();
    const result = await repos.categories.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(request: NextRequest) {
  const gate = await gateStaff('admin');
  if (!gate.ok) return gate.response;

  try {
    const req = (await request.json()) as CreateCategoryRequest;
    if (!req.slug || !req.label || !req.type) {
      return Response.json(
        { code: 'VALIDATION', message: 'slug, label et type sont requis.' },
        { status: 400 },
      );
    }
    const repos = createAdminRepositories();
    const category = await repos.categories.create({ actorId: gate.staff.id, req });
    return Response.json(category, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
