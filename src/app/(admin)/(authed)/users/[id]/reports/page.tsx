"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { reportsApi, type Report } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const tone: Record<Report["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  OPEN: "warning",
  REVIEWING: "info",
  ACTIONED: "success",
  DISMISSED: "neutral",
};

export default function UserReportsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [items, setItems] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    reportsApi
      .list({ targetType: "USER", size: 100 })
      .then((res) => {
        if (alive) setItems(res.content.filter((r) => r.targetId === id));
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="text-body text-n-500">Chargement…</p>;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Aucun signalement"
        description="Aucun utilisateur n'a signalé ce compte."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
            <th className="px-4 py-2.5 text-left">Motif</th>
            <th className="px-4 py-2.5 text-left">Détails</th>
            <th className="px-4 py-2.5 text-left">Statut</th>
            <th className="px-4 py-2.5 text-left">Reçu le</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
              <td className="px-4 py-3 text-n-700">{r.reason}</td>
              <td className="px-4 py-3 text-n-700 truncate max-w-xs">{r.details ?? "—"}</td>
              <td className="px-4 py-3">
                <Pill tone={tone[r.status]} dot>{r.status}</Pill>
              </td>
              <td className="px-4 py-3 text-caption text-n-500">
                <Link href={`/moderation/${r.id}`} className="text-primary hover:underline">
                  {formatDate(r.createdAt)}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
