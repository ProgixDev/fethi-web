/**
 * GET /api/admin/billing/summary — staff-gated (finance) real RevenueCat IAP
 * summary over `app_entitlements` + `app_store_transactions` (SCR-011).
 * Behind the `billingApi.summary` seam, used by `finance/subscriptions`.
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET() {
  const gate = await gateStaff('finance');
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const summary = await repos.billing.summary();
    return Response.json(summary);
  } catch (e) {
    return errorResponse(e);
  }
}
