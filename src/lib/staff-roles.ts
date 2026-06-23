// Client-safe staff role helpers. NO server imports (only an erased type import),
// so this is safe to use from Client Components (Sidebar). Server-only auth lives
// in `./auth` (which re-exports these).
import type { Database } from '@/lib/database.types';

export type StaffRole = Database['public']['Enums']['staff_role'];

/** `admin` implies every role. Otherwise the member must hold one of `allowed`. */
export function hasRole(roles: StaffRole[], ...allowed: StaffRole[]): boolean {
  return roles.includes('admin') || allowed.some((r) => roles.includes(r));
}
