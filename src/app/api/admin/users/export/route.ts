/**
 * GET /api/admin/users/export — staff-gated CSV export of the filtered user
 * list (matches the active filters). Streams a UTF-8 CSV (Excel-readable) so we
 * avoid a heavy xlsx dependency. Behind the `usersApi.exportXlsx` seam.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';
import type { UserFilters } from '@/lib/api';

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

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
      page: 0,
      size: 100,
    };
    const repos = createAdminRepositories();
    const { content } = await repos.users.list(filters);

    const header = [
      'id',
      'name',
      'email',
      'neighborhood',
      'status',
      'kyc',
      'rating',
      'reviews',
      'listings',
      'sales',
      'gmvCents',
      'createdAt',
    ];
    const lines = [header.join(',')];
    for (const u of content) {
      lines.push(
        [
          u.id,
          u.name,
          u.email,
          u.neighborhood,
          u.status,
          u.kyc,
          u.rating,
          u.reviewsCount,
          u.listingsCount,
          u.salesCount,
          u.gmvCents,
          u.createdAt,
        ]
          .map(csvCell)
          .join(','),
      );
    }
    const body = '﻿' + lines.join('\n'); // BOM for Excel UTF-8
    return new Response(body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="utilisateurs-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
