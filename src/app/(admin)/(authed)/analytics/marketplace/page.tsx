"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KPIStat } from "@/components/ui/KPIStat";
import { analyticsApi, financeApi, listingsApi, type UsersSummary, type FinanceSummary } from "@/lib/api";

function eur(c: number) { return `${(c / 100).toLocaleString("fr-FR")} €`; }

export default function AnalyticsMarketplacePage() {
  const [users, setUsers] = React.useState<UsersSummary | null>(null);
  const [finance, setFinance] = React.useState<FinanceSummary | null>(null);
  const [totalListings, setTotalListings] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    Promise.allSettled([
      analyticsApi.summary(),
      financeApi.summary(),
      listingsApi.list({ size: 1 }),
    ]).then(([u, f, l]) => {
      if (!alive) return;
      if (u.status === "fulfilled") setUsers(u.value);
      if (f.status === "fulfilled") setFinance(f.value);
      if (l.status === "fulfilled") {
        const total = (l.value as { totalElements?: number }).totalElements;
        setTotalListings(total ?? l.value.content.length);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Analytics marketplace" }]}
        title="Marketplace"
        description="Vue d'ensemble : utilisateurs, annonces, GMV, taux de conversion."
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat label="Utilisateurs" value={users ? users.total.toLocaleString("fr-FR") : "…"} hint={users ? `${users.active} actifs` : undefined} />
        <KPIStat label="Annonces" value={totalListings != null ? totalListings.toLocaleString("fr-FR") : "…"} hint="Total tous statuts" />
        <KPIStat label="GMV" value={finance ? eur(finance.totalGmvCents) : "…"} hint="Commandes payées" />
        <KPIStat label="Commissions" value={finance ? eur(finance.totalFeesCents) : "…"} hint="5 % du GMV" />
      </div>
      <Card><CardBody>
        <h3 className="text-h3 font-medium text-ink mb-3">À venir</h3>
        <p className="text-body-sm text-n-500">
          Graphique GMV par jour, cohortes d'inscriptions et taux de conversion seront branchés
          quand l'endpoint <code className="font-mono">/admin/analytics/marketplace/timeseries</code> sera disponible.
        </p>
      </CardBody></Card>
    </div>
  );
}
