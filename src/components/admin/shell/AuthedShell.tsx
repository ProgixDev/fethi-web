'use client';

import * as React from 'react';

import { AdminSidebar } from '@/components/admin/shell/Sidebar';
import { AdminTopBar } from '@/components/admin/shell/TopBar';
import { CommandPaletteProvider } from '@/components/admin/shell/CommandPalette';
import type { StaffRole } from '@/lib/staff-roles';

/**
 * Client shell for the authed admin area. The server guard
 * (`(admin)/(authed)/layout.tsx`) has already verified staff access and passes
 * the caller's roles down for role-gated nav. Real enforcement is server-side —
 * this only hides links the member can't use.
 */
export function AuthedShell({
  roles,
  children,
}: {
  roles: StaffRole[];
  children: React.ReactNode;
}) {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen">
        <AdminSidebar roles={roles} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
