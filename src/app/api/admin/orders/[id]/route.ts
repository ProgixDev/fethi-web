/**
 * GET  /api/admin/orders/[id]        — staff-gated single order.
 * POST /api/admin/orders/[id]        — staff-gated refund action ({ action: 'refund', amountCents? }).
 *
 * The refund kicks off an idempotent Stripe refund; the Stripe webhook remains
 * the source of truth that flips the order to REFUNDED.
 */
import type { NextRequest } from 'next/server';

import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await gateStaff('moderator', 'finance');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const repos = createAdminRepositories();
    const order = await repos.orders.get(id);
    if (!order) {
      return Response.json(
        { code: 'NOT_FOUND', message: 'Commande introuvable' },
        { status: 404 },
      );
    }
    return Response.json(order);
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Refunds move money — require the finance role specifically.
  const gate = await gateStaff('finance');
  if (!gate.ok) return gate.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.action === 'refund') {
      const repos = createAdminRepositories();
      const amountCents =
        typeof body.amountCents === 'number' ? body.amountCents : undefined;
      const order = await repos.orders.refund(id, amountCents);
      return Response.json(order);
    }

    return Response.json(
      { code: 'INVALID_ACTION', message: 'Action non reconnue' },
      { status: 400 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
