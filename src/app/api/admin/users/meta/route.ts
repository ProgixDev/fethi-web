/** GET /api/admin/users/meta — filter facets (statuses, kyc, neighborhoods). */
import { errorResponse, gateStaff } from '@/lib/admin-route';
import { createAdminRepositories } from '@/lib/repositories';

export async function GET() {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    const repos = createAdminRepositories();
    return Response.json(await repos.users.meta());
  } catch (e) {
    return errorResponse(e);
  }
}
