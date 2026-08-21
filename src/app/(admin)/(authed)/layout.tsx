import { AuthedShell } from '@/components/admin/shell/AuthedShell';
import { requireStaff } from '@/lib/auth';

/**
 * Server-side auth guard for every `(admin)/(authed)` route. Redirects to /login
 * unless the caller is a staff member (verified against the `staff_members` table
 * per request — never `user_metadata`). Roles are passed to the client shell for
 * role-gated nav; the guard itself is the real enforcement.
 */
export default async function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  return (
    <AuthedShell roles={staff.roles} email={staff.email}>
      {children}
    </AuthedShell>
  );
}
