"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { KPIStat } from "@/components/ui/KPIStat";
import { AreaChart } from "@/components/admin/charts/Chart";
import { DateRangeFilter, defaultRange } from "@/components/admin/analytics/DateRangeFilter";
import { formatNumber } from "@/lib/utils/format";
import { colors } from "@/lib/tokens";
import { analyticsApi, type AnalyticsRange, type EngagementSummary } from "@/lib/api";

export default function AnalyticsEngagementPage() {
  const [data, setData] = React.useState<EngagementSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<Required<AnalyticsRange>>(defaultRange);

  const load = React.useCallback(() => {
    analyticsApi
      .engagement(range)
      .then(setData)
      .catch((err) => console.error("engagement analytics load failed", err))
      .finally(() => setLoading(false));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  const messagesData = (data?.messagesTrend ?? []).map((p) => ({
    date: p.date.slice(5),
    value: p.count,
  }));

  // Feature-usage proxy from real activity counts on the period.
  const features = data
    ? [
        { name: "Messages échangés", count: data.messages },
        { name: "Conversations ouvertes", count: data.threads },
        { name: "Offres envoyées", count: data.offers },
        { name: "Favoris ajoutés", count: data.favorites },
        { name: "Recherches sauvegardées", count: data.savedSearches },
      ]
    : [];
  const featureMax = Math.max(1, ...features.map((f) => f.count));

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/analytics/users", label: "Analytique" },
          { label: "Engagement" },
        ]}
        title="Analytique — engagement"
        description="Activité de messagerie, offres et favoris sur la période."
      />
      <DateRangeFilter value={range} onApply={setRange} loading={loading} />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat label="Messages" value={formatNumber(data?.messages ?? 0)} hint="Sur la période" />
        <KPIStat label="Conversations" value={formatNumber(data?.threads ?? 0)} hint="Threads créés" />
        <KPIStat label="Offres" value={formatNumber(data?.offers ?? 0)} hint="Offres envoyées" />
        <KPIStat label="Favoris" value={formatNumber(data?.favorites ?? 0)} hint="Annonces sauvegardées" />
      </div>

      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <header className="pb-4">
          <p className="text-label uppercase tracking-wide text-n-500">
            Messages par jour — {range.from} → {range.to}
          </p>
        </header>
        {messagesData.length > 0 ? (
          <AreaChart
            height={240}
            data={messagesData}
            series={[{ key: "value", label: "Messages", color: colors.accent }]}
          />
        ) : (
          <p className="py-12 text-center text-body-sm text-n-500">
            {loading ? "Chargement…" : "Aucune donnée."}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-n-100 bg-surface">
        <header className="border-b border-n-100 px-5 py-4">
          <p className="text-h3 font-medium text-ink">Activité par fonctionnalité</p>
          <p className="text-body-sm text-n-500">Volume sur la période sélectionnée</p>
        </header>
        <ul className="divide-y divide-n-100">
          {features.map((f) => (
            <li key={f.name} className="flex items-center gap-4 px-5 py-3">
              <span className="flex-1 text-body text-ink">{f.name}</span>
              <span className="text-body-sm tabular text-n-700">{formatNumber(f.count)}</span>
              <div className="hidden sm:block w-32 h-1.5 overflow-hidden rounded-full bg-n-100">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.round((f.count / featureMax) * 100)}%` }}
                />
              </div>
            </li>
          ))}
          {features.length === 0 ? (
            <li className="px-5 py-6 text-center text-body-sm text-n-500">
              {loading ? "Chargement…" : "Aucune donnée."}
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
