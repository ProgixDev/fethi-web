"use client";

import * as React from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { reportsApi, type Report } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const targetLabel: Record<Report["targetType"], string> = {
  LISTING: "Annonce", USER: "Utilisateur", THREAD: "Conversation", MESSAGE: "Message",
};

export default function ModerationFlaggedPage() {
  const [items, setItems] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    reportsApi.list({ status: "REVIEWING", size: 100 })
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
          { href: "/moderation", label: "Signalements" },
          { label: "En cours d'examen" },
        ]}
        title="Signalements en cours"
        description={`${items.length} signalement(s) actuellement en revue.`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : items.length === 0 ? (
        <EmptyState icon={<Flag className="h-5 w-5" />} title="Rien en cours" description="Aucun signalement n'est en cours d'examen." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead><tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Cible</th>
              <th className="px-4 py-2.5 text-left">Motif</th>
              <th className="px-4 py-2.5 text-left">Reçu le</th>
              <th className="px-4 py-2.5 text-left"></th>
            </tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3"><Pill tone="info" dot>{targetLabel[r.targetType]}</Pill></td>
                  <td className="px-4 py-3 text-n-700">{r.reason}</td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/moderation/${r.id}`} className="text-body-sm text-primary hover:underline">Ouvrir →</Link>
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
