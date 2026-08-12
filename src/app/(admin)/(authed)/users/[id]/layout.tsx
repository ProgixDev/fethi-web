"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { UserHeader } from "@/components/admin/UserHeader";
import { UserModerationActions } from "@/components/admin/users/UserModerationActions";
import { usersApi, type AdminUserListItem } from "@/lib/api";

export default function UserDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [user, setUser] = React.useState<AdminUserListItem | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    // `?view=admin` (usersApi.get) returns the AdminUserListItem shape — the
    // same real status/kyc read UserModerationActions already uses below.
    // Previously this screen used publicUsersApi.get() and hardcoded
    // status/kyc to neutral defaults for every user; this fixes that too.
    usersApi
      .get(id)
      .then((u: AdminUserListItem) => {
        if (alive) setUser(u);
      })
      .catch((err: { message?: string } | null) => {
        if (alive) setError(err?.message ?? "Profil introuvable");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container-admin py-8">
        <p className="text-body text-n-500">Chargement…</p>
      </div>
    );
  }
  if (error || !user) {
    notFound();
  }

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/users", label: "Utilisateurs" },
          { label: user.name },
        ]}
        title={<span className="sr-only">{user.name}</span>}
      />
      <UserHeader user={user} />
      <div className="rounded-lg border border-n-100 bg-surface px-4 py-3">
        <UserModerationActions userId={user.id} />
      </div>
      {children}
    </div>
  );
}
