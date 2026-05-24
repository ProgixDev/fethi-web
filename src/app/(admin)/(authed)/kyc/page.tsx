"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { usersApi, type AdminUserListItem } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils/format";

export default function KycQueuePage() {
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    usersApi
      .list({ kyc: "PENDING", size: 100 } as never)
      .then((res) => {
        if (alive) setItems(res.content);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const queue = items.filter(
    (u) => !query || u.name?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "KYC" }]}
        title="Vérifications KYC"
        description={`${queue.length} dossiers en attente. SLA cible : 24 h.`}
        actions={
          <Link
            href="/kyc/verified"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-n-200 bg-surface px-3 text-body-sm font-medium text-n-700 hover:bg-n-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Comptes vérifiés
          </Link>
        }
      />

      <Input
        leadingIcon={<Search className="h-4 w-4" />}
        placeholder="Rechercher par nom"
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
        className="w-80"
      />

      <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Utilisateur</th>
              <th className="px-4 py-2.5 text-left">Quartier</th>
              <th className="px-4 py-2.5 text-left">Statut KYC</th>
              <th className="px-4 py-2.5 text-left">Inscrit le</th>
              <th className="px-4 py-2.5 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-n-500">
                  Chargement…
                </td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-n-500">
                  Aucun dossier en attente.
                </td>
              </tr>
            ) : (
              queue.map((u) => (
                <tr key={u.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3">
                    <Link href={`/users/${u.id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar initials={initials(u.name)} seed={u.id} size="sm" />
                      <span className="font-medium text-ink">{u.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-n-700">{u.neighborhood ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill tone="warning" dot>En attente</Pill>
                  </td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/users/${u.id}`} className="text-body-sm text-primary hover:underline">
                      Examiner →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
