// Server-side staff authorization. The source of truth is the `staff_members`
// table (SCR-002), checked PER REQUEST — never `user_metadata` (user-editable).
// A role downgrade therefore takes effect on the very next request.
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { StaffRole } from '@/lib/staff-roles';

export type { StaffRole } from '@/lib/staff-roles';
export { hasRole } from '@/lib/staff-roles';

export type StaffMember = {
  id: string;
  email: string | null;
  roles: StaffRole[];
};

/** The current staff member, or null if not signed in / not staff. */
export async function getStaffMember(): Promise<StaffMember | null> {
  const supabase = await createClient();
  // getUser() verifies the JWT with the auth server (not just a cookie decode).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('staff_members')
    .select('roles')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error || !data) return null;

  return { id: user.id, email: user.email ?? null, roles: data.roles };
}

/** Server guard: redirect to /login unless the caller is a staff member. */
export async function requireStaff(): Promise<StaffMember> {
  const staff = await getStaffMember();
  if (!staff) redirect('/login');
  return staff;
}
