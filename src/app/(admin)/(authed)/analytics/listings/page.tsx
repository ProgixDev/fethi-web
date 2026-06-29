"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KPIStat } from "@/components/ui/KPIStat";
import { BarChart } from "@/components/admin/charts/Chart";
import { DateRangeFilter, defaultRange } from "@/components/admin/analytics/DateRangeFilter";
import { formatNumber } from "@/lib/utils/format";
import { colors } from "@/lib/tokens";
import { analyticsApi, type AnalyticsRange, type ListingsSummary } from "@/lib/api";

export default function AnalyticsListingsPage() {
  const [data, setData] = React.useState<ListingsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<Required<AnalyticsRange>>(defaultRange);

  const load = React.useCallback(() => {
    analyticsApi
      .listings(range)
      .then(setData)
      .catch((err) => console.error("listings analytics load failed", err))
      .finally(() => setLoading(false));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  const byTypeMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data?.byType ?? []) m.set(d.label, d.count);
    return m;
  }, [data]);

  const statusData = (data?.byStatus ?? []).map((d) => ({ name: d.label, count: d.count }));

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Analytics annonces" }]}
        title="Annonces"
        description={data ? `${formatNumber(data.total)} annonce(s) sur la période.` : "Chargement…"}
      />
      <DateRangeFilter value={range} onApply={setRange} loading={loading} />
      {loading && !data ? (
        <p className="text-body text-n-500">Chargement…</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <KPIStat label="Ventes" value={formatNumber(byTypeMap.get("VENTE") ?? 0)} />
            <KPIStat label="Locations" value={formatNumber(byTypeMap.get("LOCATION") ?? 0)} />
            <KPIStat label="Services" value={formatNumber(byTypeMap.get("SERVICE") ?? 0)} />
            <KPIStat
              label="Vues cumulées"
              value={formatNumber(data?.totalViews ?? 0)}
              hint={`${formatNumber(data?.totalFavorites ?? 0)} favoris`}
            />
          </div>
          <section className="rounded-lg border border-n-100 bg-surface p-5">
            <header className="pb-4">
              <p className="text-label uppercase tracking-wide text-n-500">Par statut</p>
              <p className="mt-1 text-body-sm text-n-500">
                Répartition DRAFT / ACTIVE / PAUSED / SOLD / ARCHIVED
              </p>
            </header>
            {statusData.some((d) => d.count > 0) ? (
              <BarChart
                height={260}
                vertical
                data={statusData}
                xKey="name"
                series={[{ key: "count", label: "Annonces", color: colors.primary }]}
              />
            ) : (
              <p className="py-12 text-center text-body-sm text-n-500">Aucune donnée.</p>
            )}
          </section>
          <Card>
            <CardBody>
              <h3 className="text-h3 font-medium text-ink mb-3">Top catégories</h3>
              <ul className="space-y-2 text-body-sm">
                {(data?.topCategories ?? []).map((c) => (
                  <li key={c.label} className="flex justify-between">
                    <span className="text-n-700">{c.label}</span>
                    <span className="tabular text-ink">{c.count}</span>
                  </li>
                ))}
                {(data?.topCategories ?? []).length === 0 ? (
                  <li className="text-n-500">Pas de données</li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
