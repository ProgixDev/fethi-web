"use client";

import * as React from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { supportApi, type SupportTicket, type SupportTicketStatus } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const statusTone: Record<SupportTicketStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};
const statusLabel: Record<SupportTicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

const FILTERS: { value: SupportTicketStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "OPEN", label: "Ouverts" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolus" },
  { value: "CLOSED", label: "Fermés" },
];

export default function CommunicationsSupportPage() {
  const [items, setItems] = React.useState<SupportTicket[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<SupportTicketStatus | "ALL">("OPEN");

  const load = React.useCallback((status: SupportTicketStatus | "ALL") => {
    setLoading(true);
    supportApi
      .list({ status: status === "ALL" ? undefined : status, size: 100 })
      .then((res) => setItems(res.content))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load(filter);
  }, [filter, load]);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/notifications", label: "Communications" },
          { label: "Support" },
        ]}
        title="Centre de support"
        description="Demandes des utilisateurs, envoyées depuis l'application."
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-body-sm transition-colors ${
              filter === f.value
                ? "bg-ink text-white"
                : "bg-n-100 text-n-600 hover:bg-n-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-body text-n-500">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="h-5 w-5" />}
          title="Rien à traiter"
          description="Aucune demande de support pour ce filtre."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
                <th className="px-4 py-2.5 text-left">Statut</th>
                <th className="px-4 py-2.5 text-left">Demandeur</th>
                <th className="px-4 py-2.5 text-left">Sujet</th>
                <th className="px-4 py-2.5 text-left">Dernier message</th>
                <th className="px-4 py-2.5 text-left">Mis à jour</th>
                <th className="px-4 py-2.5 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3">
                    <Pill tone={statusTone[t.status]} dot>
                      {statusLabel[t.status]}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-n-700">
                    {t.requesterName}
                    {t.unreadByStaff > 0 ? (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-caption font-medium text-white">
                        {t.unreadByStaff}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-n-700">{t.subject}</td>
                  <td className="px-4 py-3 text-n-500 max-w-xs truncate">
                    {t.lastMessage ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-caption text-n-500">
                    {formatDate(t.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/communications/support/${t.id}`}
                      className="text-body-sm text-primary hover:underline"
                    >
                      Ouvrir →
                    </Link>
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
