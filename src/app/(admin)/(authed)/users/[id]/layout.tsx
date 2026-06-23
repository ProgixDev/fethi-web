"use client";

import * as React from "react";
import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { UserHeader } from "@/components/admin/UserHeader";
import { UserModerationActions } from "@/components/admin/users/UserModerationActions";
import { publicUsersApi, type PublicProfile } from "@/lib/api";
import type { User } from "@/lib/fixtures/users";

// Convertit le DTO backend PublicProfile vers le type User que UserHeader attend.
// Champs non disponibles cote backend -> defauts neutres.
function toUser(p: PublicProfile): User {
  return {
    id: p.id,
    name: p.displayName ?? "Voisin·e",
    handle: (p.displayName ?? "user").toLowerCase().replace(/\s+/g, "-"),
    email: "",
    phone: "",
    avatarSeed: p.id,
    neighborhood: (p.neighborhood?.toLowerCase().replace(/\s+/g, "-") ?? "vieux-lille") as User["neighborhood"],
    joinedAt: p.createdAt,
    lastActiveAt: p.createdAt,
    status: "active",
    kyc: "unverified",
    rating: p.rating ?? 0,
    reviews: p.reviewsCount ?? 0,
    listings: p.listingsCount ?? 0,
    sales: p.salesCount ?? 0,
    purchases: 0,
    gmv: 0,
    flagged: 0,
    bio: p.bio ?? undefined,
  };
}

export default function UserDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    publicUsersApi
      .get(id)
      .then((p: PublicProfile) => {
        if (alive) setUser(toUser(p));
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
