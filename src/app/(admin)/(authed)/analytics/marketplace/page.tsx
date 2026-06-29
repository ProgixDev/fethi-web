"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KPIStat } from "@/components/ui/KPIStat";
import { AreaChart, BarChart } from "@/components/admin/charts/Chart";
import { DateRangeFilter, defaultRange } from "@/components/admin/analytics/DateRangeFilter";
import { colors } from "@/lib/tokens";
import { analyticsApi, type AnalyticsRange, type MarketplaceSummary } from "@/lib/api";

function eur(c: number) {
  return `${(c / 100).toLocaleString("fr-FR")} €`;
}

export default function AnalyticsMarketplacePage() {
  const [data, setData] = React.useState<MarketplaceSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<Required<AnalyticsRange>>(defaultRange);

  const load = React.useCallback(() => {
    analyticsApi
      .marketplace(range)
      .then(setData)
      .catch((err) => console.error("marketplace analytics load failed", err))
      .finally(() => setLoading(false));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  const gmvData = (data?.gmvTrend ?? []).map((p) => ({
    date: p.date.slice(5),
    value: p.count / 100,
  }));
  const ordersData = (data?.ordersByStatus ?? []).map((d) => ({ name: d.label, count: d.count }));

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Analytics marketplace" }]}
        title="Marketplace"
        description="Vue d'ensemble : utilisateurs, annonces, GMV, commandes."
      />
      <DateRangeFilter value={range} onApply={setRange} loading={loading} />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat
          label="Utilisateurs"
          value={data ? data.totalUsers.toLocaleString("fr-FR") : "…"}
          hint={data ? `${data.activeUsers} actifs` : undefined}
        />
        <KPIStat
          label="Annonces"
          value={data ? data.totalListings.toLocaleString("fr-FR") : "…"}
          hint="Total tous statuts"
        />
        <KPIStat
          label="GMV (période)"
          value={data ? eur(data.gmvCents) : "…"}
          hint={data ? `${data.completedOrders} commandes payées` : undefined}
        />
        <KPIStat
          label="Commissions"
          value={data ? eur(data.feesCents) : "…"}
          hint="Sur commandes payées"
        />
      </div>

      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <header className="pb-4">
          <p className="text-label uppercase tracking-wide text-n-500">GMV par jour (€)</p>
          <p className="mt-1 text-body-sm text-n-500">
            Commandes payées · {range.from} → {range.to}
          </p>
        </header>
        {gmvData.length > 0 ? (
          <AreaChart
            height={260}
            data={gmvData}
            series={[{ key: "value", label: "GMV (€)", color: colors.accent }]}
          />
        ) : (
          <p className="py-12 text-center text-body-sm text-n-500">
            {loading ? "Chargement…" : "Aucune commande payée sur la période."}
          </p>
        )}
      </section>

      <Card>
        <CardBody>
          <h3 className="text-h3 font-medium text-ink mb-3">Commandes par statut</h3>
          {ordersData.some((d) => d.count > 0) ? (
            <BarChart
              height={240}
              vertical
              data={ordersData}
              xKey="name"
              series={[{ key: "count", label: "Commandes", color: colors.primary }]}
            />
          ) : (
            <p className="py-8 text-center text-body-sm text-n-500">Aucune commande sur la période.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
