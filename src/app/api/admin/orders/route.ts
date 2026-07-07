/**
 * GET /api/admin/orders — staff-gated, server-side paginated orders list.
 * Reads every order from Supabase (staff scope) via OrdersRepository.
 * Behind the `ordersApi` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff, num } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { OrderFilters, OrderStatus } from '@/lib/api';

export async function GET(request: NextRequest) {
  const gate = await gateStaff('moderator', 'finance');
  if (!gate.ok) return gate.response;

  try {
    const sp = request.nextUrl.searchParams;
    const filters: OrderFilters = {
      status: (sp.get('status') ?? undefined) as OrderStatus | undefined,
      buyerId: sp.get('buyerId') ?? undefined,
      sellerId: sp.get('sellerId') ?? undefined,
      page: num(sp.get('page')),
      size: num(sp.get('size')),
    };
    const repos = createAdminRepositories();
    const result = await repos.orders.list(filters);
    return Response.json(result);
  } catch (e) {
    return errorResponse(e);
  }
}
