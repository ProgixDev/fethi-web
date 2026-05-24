"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { usersApi, type AdminUserListItem } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils/format";

export default function KycVerifiedPage() {
  const [items, setItems] = React.useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    usersApi.list({ kyc: "VERIFIED", size: 200 } as never)
      .then((res) => { if (alive) setItems(res.content); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/kyc", label: "KYC" },
          { label: "Vérifiés" },
        ]}
        title="Comptes vérifiés"
        description={`${items.length} compte(s) ayant passé la vérification.`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead><tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Utilisateur</th>
              <th className="px-4 py-2.5 text-left">Quartier</th>
              <th className="px-4 py-2.5 text-left">Vérifié</th>
              <th className="px-4 py-2.5 text-left">Inscrit le</th>
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
                  <td className="px-4 py-3 text-n-700">{u.neighborhood ?? "—"}</td>
                  <td className="px-4 py-3"><Pill tone="success" dot><CheckCircle2 className="h-3 w-3 mr-1 inline" />Vérifié</Pill></td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
