"use client";

import * as React from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { ordersApi, type AdminOrder } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function formatEur(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

function KPI({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-caption text-n-500">{label}</p>
        <p className="mt-1 text-h2 font-medium tabular text-ink">{value}</p>
      </CardBody>
    </Card>
  );
}

export default function RefundsPage() {
  const [items, setItems] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    ordersApi
      .list({ status: "REFUNDED", size: 100 })
      .then((res) => {
        if (alive) setItems(res.content);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const totalCents = items.reduce((acc, o) => acc + (o.amountCents ?? 0), 0);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Remboursements" }]}
        title="Remboursements"
        description="Tous les remboursements émis depuis l'ouverture de la plateforme."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <KPI label="Remboursements" value={items.length} />
        <KPI label="Montant total remboursé" value={formatEur(totalCents)} />
        <KPI label="Statut moyen" value={items.length > 0 ? "REFUNDED" : "—"} />
      </div>
      {loading ? (
        <p className="text-body text-n-500">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-5 w-5" />}
          title="Aucun remboursement"
          description="Aucune commande n'a été remboursée à ce jour."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
                <th className="px-4 py-2.5 text-left">Référence</th>
                <th className="px-4 py-2.5 text-left">Annonce</th>
                <th className="px-4 py-2.5 text-left">Montant</th>
                <th className="px-4 py-2.5 text-left">Statut</th>
                <th className="px-4 py-2.5 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${o.id}`} className="font-medium tabular text-ink hover:text-primary">
                      #{o.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-n-700 truncate max-w-xs">
                    {o.listingTitleSnapshot ?? "—"}
                  </td>
                  <td className="px-4 py-3 tabular text-ink">{formatEur(o.amountCents)}</td>
                  <td className="px-4 py-3">
                    <Pill tone="danger" dot>Remboursé</Pill>
                  </td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
