/**
 * GET /api/admin/me — the signed-in staff member's own identity (id, email,
 * roles), read straight from the Supabase auth session + `staff_members`.
 * Behind the `staffApi.me` seam, used by the profile page's identity card.
 */
import { errorResponse, gateStaff } from '@/lib/admin-route';

export async function GET() {
  const gate = await gateStaff();
  if (!gate.ok) return gate.response;
  try {
    return Response.json({
      id: gate.staff.id,
      email: gate.staff.email,
      roles: gate.staff.roles,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
