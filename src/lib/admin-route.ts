/**
 * Helpers for admin Route Handlers (server-only).
 *
 * Every admin API route is a staff seam: it must verify the caller is a staff
 * member (per request, against `staff_members` — never user_metadata) and, for
 * mutations, hold the right role, BEFORE touching the service-role client. These
 * helpers centralise that gate and the JSON error shape the `src/lib/api.ts`
 * `ApiError` parser expects (`{ code, message }`).
 */
import { getStaffMember, hasRole, type StaffMember, type StaffRole } from '@/lib/auth';

export type GateResult =
  | { ok: true; staff: StaffMember }
  | { ok: false; response: Response };

function err(status: number, code: string, message: string): Response {
  return Response.json({ code, message }, { status });
}

/** Require an authenticated staff member; optionally require one of `roles`. */
export async function gateStaff(...roles: StaffRole[]): Promise<GateResult> {
  const staff = await getStaffMember();
  if (!staff) {
    return { ok: false, response: err(401, 'UNAUTHENTICATED', 'Authentification requise.') };
  }
  if (roles.length > 0 && !hasRole(staff.roles, ...roles)) {
    return { ok: false, response: err(403, 'FORBIDDEN', "Rôle insuffisant pour cette action.") };
  }
  return { ok: true, staff };
}

/** Map a thrown repository error to the right HTTP status + code. */
export function errorResponse(e: unknown): Response {
  const message = e instanceof Error ? e.message : 'Erreur interne.';
  if (message.startsWith('SELF_ACTION')) return err(409, 'SELF_ACTION', message);
  if (message.startsWith('NOT_FOUND')) return err(404, 'NOT_FOUND', message);
  if (message.startsWith('INVALID_STATUS')) return err(422, 'INVALID_STATUS', message);
  if (message.startsWith('IN_USE')) return err(409, 'IN_USE', message);
  console.error('[admin-route]', message);
  return err(500, 'INTERNAL', 'Erreur interne du serveur.');
}

/** Parse a typed query param. */
export function num(value: string | null): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse the optional `?from=&to=` analytics date range from a request's query
 * (ISO date strings, inclusive). Used by the analytics Route Handlers. */
export function analyticsRange(
  searchParams: URLSearchParams,
): { from?: string; to?: string } {
  return {
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  };
}
