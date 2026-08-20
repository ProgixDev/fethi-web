/**
 * GET /api/admin/analytics/cities — staff-gated real signup distribution by
 * city (`profiles.city`/`neighborhood` — there is no `cities` table). Behind
 * the `analyticsApi.cities` seam, used by `settings/cities`.
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET() {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    const cities = await repos.analytics.citiesSummary();
    return Response.json(cities);
  } catch (e) {
    return errorResponse(e);
  }
}
