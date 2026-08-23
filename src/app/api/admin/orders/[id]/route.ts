/**
 * GET  /api/admin/orders/[id]        — staff-gated single order.
 * POST /api/admin/orders/[id]        — staff-gated refund or timeout-release action.
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
    if (body.action === 'release_held_proceeds') {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const secret = process.env.HELD_PROCEEDS_RESOLUTION_SECRET;
      if (!url || !secret) throw new Error('HELD_PROCEEDS_RESOLUTION_UNCONFIGURED');
      const result = await fetch(`${url}/functions/v1/held-proceeds-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Resolution-Secret': secret },
        body: JSON.stringify({ orderId: id }),
      });
      if (!result.ok) throw new Error(`HELD_PROCEEDS_RESOLUTION_FAILED: ${await result.text()}`);
      const repos = createAdminRepositories();
      return Response.json(await repos.orders.get(id));
    }

    return Response.json(
      { code: 'INVALID_ACTION', message: 'Action non reconnue' },
      { status: 400 },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
