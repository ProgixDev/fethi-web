"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { DateRangeFilter, defaultRange } from "@/components/admin/analytics/DateRangeFilter";
import { analyticsApi, type AnalyticsRange, type DistItem } from "@/lib/api";

export default function AnalyticsGeoPage() {
  const [usersByNeighborhood, setUsersByN] = React.useState<DistItem[]>([]);
  const [listingsByNeighborhood, setListingsByN] = React.useState<DistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [range, setRange] = React.useState<Required<AnalyticsRange>>(defaultRange);

  const load = React.useCallback(() => {
    analyticsApi
      .geo(range)
      .then((g) => {
        setUsersByN(g.usersByNeighborhood);
        setListingsByN(g.listingsByNeighborhood);
      })
      .catch((err) => console.error("geo analytics load failed", err))
      .finally(() => setLoading(false));
  }, [range]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Analytics géo" }]}
        title="Répartition géographique"
        description="Utilisateurs et annonces par quartier."
      />
      <DateRangeFilter value={range} onApply={setRange} loading={loading} />
      {loading ? (
        <p className="text-body text-n-500">Chargement…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardBody>
              <h3 className="text-h3 font-medium text-ink mb-3">Utilisateurs par quartier</h3>
              <ul className="space-y-2 text-body-sm">
                {usersByNeighborhood.map((d) => (
                  <li key={d.label} className="flex justify-between">
                    <span className="text-n-700">{d.label}</span>
                    <span className="tabular text-ink">{d.count}</span>
                  </li>
                ))}
                {usersByNeighborhood.length === 0 ? (
                  <li className="text-n-500">Pas de données</li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-h3 font-medium text-ink mb-3">Annonces par quartier</h3>
              <ul className="space-y-2 text-body-sm">
                {listingsByNeighborhood.map((d) => (
                  <li key={d.label} className="flex justify-between">
                    <span className="text-n-700">{d.label}</span>
                    <span className="tabular text-ink">{d.count}</span>
                  </li>
                ))}
                {listingsByNeighborhood.length === 0 ? (
                  <li className="text-n-500">Pas de données</li>
                ) : null}
              </ul>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
