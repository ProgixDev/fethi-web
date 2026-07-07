/**
 * GET /api/admin/finance/summary — staff-gated finance reconciliation summary
 * (GMV, fees, order counts by status), aggregated in the database.
 * Behind the `financeApi.summary` seam.
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET() {
  const gate = await gateStaff('moderator', 'finance');
  if (!gate.ok) return gate.response;

  try {
    const repos = createAdminRepositories();
    const summary = await repos.orders.summary();
    return Response.json(summary);
  } catch (e) {
    return errorResponse(e);
  }
}
