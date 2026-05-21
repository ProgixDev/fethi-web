"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { FileText, MessageSquare, Search, User as UserIcon } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DataTable } from "@/components/admin/tables/DataTable";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardBody } from "@/components/ui/Card";
import { reportsApi, type Report, type ReportStatus, type ReportTargetType } from "@/lib/api";
import { formatDateTime } from "@/lib/utils/format";

// Mapping presentation depuis les statuts backend ----------------------------

const statusTone: Record<ReportStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  OPEN: "warning",
  REVIEWING: "info",
  ACTIONED: "success",
  DISMISSED: "neutral",
};
const statusLabel: Record<ReportStatus, string> = {
  OPEN: "Ouvert",
  REVIEWING: "En cours",
  ACTIONED: "Résolu",
  DISMISSED: "Rejeté",
};

const targetIcon: Record<ReportTargetType, React.ReactNode> = {
  LISTING: <FileText className="h-3.5 w-3.5" />,
  USER: <UserIcon className="h-3.5 w-3.5" />,
  THREAD: <MessageSquare className="h-3.5 w-3.5" />,
  MESSAGE: <MessageSquare className="h-3.5 w-3.5" />,
};

const targetLabel: Record<ReportTargetType, string> = {
  LISTING: "Annonce",
  USER: "Utilisateur",
  THREAD: "Conversation",
  MESSAGE: "Message",
};

export default function ModerationPage() {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ReportStatus | "all">("all");
  const [targetType, setTargetType] = React.useState<ReportTargetType | "all">("all");
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load + refresh quand on change le filtre statut
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    reportsApi
      .list({
        status: statusFilter === "all" ? undefined : statusFilter,
        targetType: targetType === "all" ? undefined : targetType,
        size: 100,
      })
      .then((res) => {
        if (alive) setReports(res.content);
      })
      .catch((err) => {
        if (alive) setError(err?.message ?? "Chargement impossible");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [statusFilter, targetType]);

  // KPIs (calcules depuis la page courante — pour des compteurs reels on
  // pourrait ajouter /admin/reports/counts plus tard)
  const open = reports.filter((r) => r.status === "OPEN").length;
  const inReview = reports.filter((r) => r.status === "REVIEWING").length;
  const resolved = reports.filter((r) => r.status === "ACTIONED").length;

  const columns = React.useMemo<ColumnDef<Report>[]>(
    () => [
      {
        id: "target",
        header: "Cible",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-n-100 text-n-700">
                {targetIcon[r.targetType]}
              </span>
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-ink truncate">
                  {targetLabel[r.targetType]} · {r.targetId.slice(0, 8)}
                </p>
                <p className="text-caption text-n-500 truncate">{r.reason}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "details",
        header: "Détails",
        cell: ({ row }) => (
          <span className="text-body-sm text-n-700 line-clamp-2">
            {row.original.details ?? <span className="text-n-400">—</span>}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Reçu le",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-caption text-n-500">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => (
          <Pill tone={statusTone[row.original.status]} dot>
            {statusLabel[row.original.status]}
          </Pill>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/moderation/${row.original.id}`}
            className="text-body-sm font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ouvrir →
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Modération" }]}
        title="Modération"
        description={`${open + inReview} signalements en cours de traitement.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiTile label="Ouverts" value={open} tone="warning" />
        <KpiTile label="En cours" value={inReview} tone="info" />
        <KpiTile label="Résolus" value={resolved} tone="success" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher motif, détails…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.currentTarget.value as ReportStatus | "all")}
          className="w-40"
        >
          <option value="all">Tous statuts</option>
          {(Object.keys(statusLabel) as ReportStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </Select>
        <Select
          value={targetType}
          onChange={(e) => setTargetType(e.currentTarget.value as ReportTargetType | "all")}
          className="w-40"
        >
          <option value="all">Toutes cibles</option>
          {(Object.keys(targetLabel) as ReportTargetType[]).map((tt) => (
            <option key={tt} value={tt}>
              {targetLabel[tt]}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <Card>
          <CardBody>
            <p className="text-body-sm text-danger">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={reports}
        globalFilter={query}
        getRowId={(r) => r.id}
        empty={loading ? "Chargement…" : "Aucun signalement à examiner."}
      />
    </div>
  );
}

function KpiTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "info" | "success";
}) {
  return (
    <Card>
      <CardBody className="space-y-2">
        <p className="text-label uppercase tracking-wide text-n-500">{label}</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-display tracking-tight text-ink tabular">{value}</p>
          <Pill tone={tone} dot>
            {label}
          </Pill>
        </div>
      </CardBody>
    </Card>
  );
}
