"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/shell/Sidebar";
import { AdminTopBar } from "@/components/admin/shell/TopBar";
import { CommandPaletteProvider } from "@/components/admin/shell/CommandPalette";
import { tokenStore } from "@/lib/api";

/**
 * Garde d'auth : si pas d'access token en localStorage on redirige vers /login.
 * Check uniquement côté client (Next charge le bundle, le localStorage est dispo
 * juste après le mount). Pour une vraie prod il faudrait un middleware avec
 * cookies, mais pour le back-office interne c'est suffisant.
 */
export default function AdminAuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState(false);

  React.useEffect(() => {
    if (!tokenStore.getAccess()) {
      router.replace("/login");
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-n-500">
        <span className="text-body-sm">Vérification de la session…</span>
      </div>
    );
  }

  return (
    <CommandPaletteProvider>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
