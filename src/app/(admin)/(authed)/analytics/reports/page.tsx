"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KPIStat } from "@/components/ui/KPIStat";
import { BarChart, LineChart } from "@/components/admin/charts/Chart";
import { DateRangeFilter, defaultRange } from "@/components/admin/analytics/DateRangeFilter";
import { formatNumber } from "@/lib/utils/format";
import { colors } from "@/lib/tokens";
import { analyticsApi, type AnalyticsRange, type ReportsAnalyticsSummary } from "@/lib/api";

export default function AnalyticsReportsPage() {
  const [data, setData] = React.useState<ReportsAnalyticsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<Required<AnalyticsRange>>(defaultRange);

  const load = React.useCallback(() => {
    analyticsApi
      .reports(range)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error("reports analytics load failed", err);
        setError("Impossible de charger les statistiques de signalements.");
      })
      .finally(() => setLoading(false));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  const trendData = (data?.trend ?? []).map((p) => ({ date: p.date.slice(5), value: p.count }));
  const statusData = (data?.byStatus ?? []).map((d) => ({ name: d.label, count: d.count }));
  const targetData = (data?.byTargetType ?? []).map((d) => ({ name: d.label, count: d.count }));

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/analytics/users", label: "Analytique" },
          { label: "Signalements" },
        ]}
        title="Analytique — signalements"
        description="Volume et statut des signalements de modération sur la période."
      />
      <DateRangeFilter value={range} onApply={setRange} loading={loading} />

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">{error}</div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat label="Signalements" value={formatNumber(data?.total ?? 0)} hint="Sur la période" />
        <KPIStat label="Ouverts" value={formatNumber(data?.open ?? 0)} hint="Statut OPEN" />
        <KPIStat
          label="Traités"
          value={formatNumber(
            data?.byStatus.find((d) => d.label === "ACTIONED")?.count ?? 0,
          )}
          hint="Statut ACTIONED"
        />
        <KPIStat
          label="Rejetés"
          value={formatNumber(
            data?.byStatus.find((d) => d.label === "DISMISSED")?.count ?? 0,
          )}
          hint="Statut DISMISSED"
        />
      </div>

      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <header className="pb-4">
          <p className="text-label uppercase tracking-wide text-n-500">
            Signalements par jour — {range.from} → {range.to}
          </p>
        </header>
        {trendData.length > 0 ? (
          <LineChart
            height={240}
            data={trendData}
            series={[{ key: "value", label: "Signalements", color: colors.primary }]}
          />
        ) : (
          <p className="py-12 text-center text-body-sm text-n-500">
            {loading ? "Chargement…" : "Aucune donnée."}
          </p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Par statut</h3>
            {statusData.some((d) => d.count > 0) ? (
              <BarChart
                height={240}
                vertical
                data={statusData}
                xKey="name"
                series={[{ key: "count", label: "Signalements", color: colors.primary }]}
              />
            ) : (
              <p className="py-8 text-center text-body-sm text-n-500">Aucune donnée.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Par cible</h3>
            {targetData.some((d) => d.count > 0) ? (
              <BarChart
                height={240}
                vertical
                data={targetData}
                xKey="name"
                series={[{ key: "count", label: "Signalements", color: colors.accent }]}
              />
            ) : (
              <p className="py-8 text-center text-body-sm text-n-500">Aucune donnée.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
