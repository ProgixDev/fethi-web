"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import {
  publicUsersApi,
  listingsApi,
  type PublicProfile,
  type Listing,
} from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function formatEur(cents: number | null | undefined) {
  if (!cents) return "—";
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

export default function UserOverviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [user, setUser] = React.useState<PublicProfile | null>(null);
  const [userListings, setUserListings] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    Promise.all([
      publicUsersApi.get(id).catch(() => null),
      listingsApi.list({ ownerId: id, size: 20 }).catch(() => null),
    ]).then(([u, l]) => {
      if (!alive) return;
      setUser(u);
      setUserListings(l?.content ?? []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="text-body text-n-500">Chargement…</p>;

  const activeCount = userListings.filter((l) => l.status === "ACTIVE").length;
  const stats = [
    { label: "Ventes réalisées", value: user?.salesCount ?? 0 },
    { label: "Annonces totales", value: user?.listingsCount ?? userListings.length },
    { label: "Annonces actives", value: activeCount },
    { label: "Avis reçus", value: user?.reviewsCount ?? 0 },
    { label: "Note moyenne", value: user?.rating != null ? user.rating.toFixed(1) : "—" },
    { label: "Inscrit le", value: user?.createdAt ? formatDate(user.createdAt) : "—" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardBody>
            <h3 className="text-h3 font-medium text-ink">Bio</h3>
            <p className="mt-2 text-body text-n-700">
              {user?.bio ?? "Aucune biographie renseignée."}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <h3 className="text-h3 font-medium text-ink">Indicateurs</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-md bg-paper p-3">
                  <p className="text-caption text-n-500">{s.label}</p>
                  <p className="mt-1 text-h3 font-medium tabular text-ink">{s.value}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <h3 className="text-h3 font-medium text-ink">Annonces récentes</h3>
              <Link
                href={`/users/${id}/listings`}
                className="text-body-sm text-primary hover:underline"
              >
                Tout voir →
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-n-100">
              {userListings.slice(0, 5).map((l) => (
                <li key={l.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-ink truncate">{l.title}</p>
                    <p className="text-caption text-n-500">
                      {l.neighborhood ?? "—"} · {formatDate(l.createdAt)}
                    </p>
                  </div>
                  <span className="text-body-sm tabular text-ink">{formatEur(l.priceCents)}</span>
                  <Pill tone={l.status === "ACTIVE" ? "success" : "neutral"}>{l.status}</Pill>
                </li>
              ))}
              {userListings.length === 0 ? (
                <li className="py-3 text-body-sm text-n-500">Aucune annonce.</li>
              ) : null}
            </ul>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardBody className="space-y-2">
            <h3 className="text-h3 font-medium text-ink">Informations</h3>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between">
                <dt className="text-n-500">Quartier</dt>
                <dd className="text-ink">{user?.neighborhood ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-n-500">Ville</dt>
                <dd className="text-ink">{user?.city ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-n-500">Profession</dt>
                <dd className="text-ink">{user?.profession ?? "—"}</dd>
              </div>
              {user?.age != null ? (
                <div className="flex justify-between">
                  <dt className="text-n-500">Âge</dt>
                  <dd className="text-ink">{user.age} ans</dd>
                </div>
              ) : null}
            </dl>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
