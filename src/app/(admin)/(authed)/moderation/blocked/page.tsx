"use client";

import * as React from "react";
import Link from "next/link";
import { Ban } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { usersApi, type AdminUserListItem } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils/format";

export default function ModerationBlockedPage() {
  const [items, setItems] = React.useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    // Récupère SUSPENDED + BANNED en deux appels et concatène
    Promise.all([
      usersApi.list({ status: "SUSPENDED", size: 100 } as never).catch(() => null),
      usersApi.list({ status: "BANNED", size: 100 } as never).catch(() => null),
    ]).then(([sus, ban]) => {
      if (!alive) return;
      const all = [...(sus?.content ?? []), ...(ban?.content ?? [])];
      setItems(all);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/moderation", label: "Modération" },
          { label: "Comptes bloqués" },
        ]}
        title="Comptes bloqués"
        description={`${items.length} compte(s) suspendu(s) ou banni(s).`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : items.length === 0 ? (
        <EmptyState icon={<Ban className="h-5 w-5" />} title="Aucun compte bloqué" description="Tous les comptes sont actifs." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead><tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Utilisateur</th>
              <th className="px-4 py-2.5 text-left">Statut</th>
              <th className="px-4 py-2.5 text-left">Inscrit le</th>
              <th className="px-4 py-2.5 text-left"></th>
            </tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3">
                    <Link href={`/users/${u.id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar initials={initials(u.name)} seed={u.id} size="sm" />
                      <span className="font-medium text-ink">{u.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Pill tone="danger" dot>{u.status}</Pill></td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/users/${u.id}`} className="text-body-sm text-primary hover:underline">Voir →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
