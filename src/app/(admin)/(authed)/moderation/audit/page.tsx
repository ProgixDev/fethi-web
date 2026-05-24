"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, MessageSquare, User as UserIcon, FileSearch } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { reportsApi, type Report, type ReportTargetType } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const tone: Record<Report["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  OPEN: "warning", REVIEWING: "info", ACTIONED: "success", DISMISSED: "neutral",
};
const targetIcon: Record<ReportTargetType, React.ReactNode> = {
  LISTING: <FileText className="h-3.5 w-3.5" />,
  USER: <UserIcon className="h-3.5 w-3.5" />,
  THREAD: <MessageSquare className="h-3.5 w-3.5" />,
  MESSAGE: <MessageSquare className="h-3.5 w-3.5" />,
};

export default function ModerationAuditPage() {
  const [items, setItems] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    // L'audit log montre toutes les décisions de modération (ACTIONED + DISMISSED)
    Promise.all([
      reportsApi.list({ status: "ACTIONED", size: 50 }).catch(() => null),
      reportsApi.list({ status: "DISMISSED", size: 50 }).catch(() => null),
    ]).then(([a, d]) => {
      if (!alive) return;
      const all = [...(a?.content ?? []), ...(d?.content ?? [])];
      all.sort((x, y) => y.createdAt.localeCompare(x.createdAt));
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
          { label: "Journal" },
        ]}
        title="Journal de modération"
        description={`${items.length} décision(s) prises (action ou rejet).`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : items.length === 0 ? (
        <EmptyState icon={<FileSearch className="h-5 w-5" />} title="Pas de décisions" description="Aucune action de modération à journaliser." />
      ) : (
        <Card><CardBody>
          <ul className="divide-y divide-n-100">
            {items.map((r) => (
              <li key={r.id} className="py-3 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-n-100 text-n-700">{targetIcon[r.targetType]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm font-medium text-ink truncate">{r.reason}</p>
                  <p className="text-caption text-n-500">{r.targetType} · #{r.targetId.slice(0, 8)} · {formatDate(r.createdAt)}</p>
                </div>
                <Pill tone={tone[r.status]} dot>{r.status}</Pill>
                <Link href={`/moderation/${r.id}`} className="text-body-sm text-primary hover:underline ml-2">Voir →</Link>
              </li>
            ))}
          </ul>
        </CardBody></Card>
      )}
    </div>
  );
}
