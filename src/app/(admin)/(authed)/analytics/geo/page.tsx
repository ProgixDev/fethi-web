"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { analyticsApi, listingsApi, type DistItem, type Listing } from "@/lib/api";

export default function AnalyticsGeoPage() {
  const [usersByNeighborhood, setUsersByN] = React.useState<DistItem[]>([]);
  const [listingsByNeighborhood, setListingsByN] = React.useState<Map<string, number>>(new Map());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    Promise.all([
      analyticsApi.byNeighborhood().catch(() => []),
      listingsApi.list({ size: 500 }).catch(() => null),
    ]).then(([u, l]) => {
      if (!alive) return;
      setUsersByN(u as DistItem[]);
      if (l) {
        const m = new Map<string, number>();
        for (const x of (l as { content: Listing[] }).content) {
          const k = x.neighborhood ?? "—";
          m.set(k, (m.get(k) ?? 0) + 1);
        }
        setListingsByN(m);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Analytics géo" }]}
        title="Répartition géographique"
        description="Utilisateurs et annonces par quartier."
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Utilisateurs par quartier</h3>
            <ul className="space-y-2 text-body-sm">
              {usersByNeighborhood.map((d) => (
                <li key={d.label} className="flex justify-between">
                  <span className="text-n-700">{d.label}</span>
                  <span className="tabular text-ink">{d.count}</span>
                </li>
              ))}
              {usersByNeighborhood.length === 0 ? <li className="text-n-500">Pas de données</li> : null}
            </ul>
          </CardBody></Card>
          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Annonces par quartier</h3>
            <ul className="space-y-2 text-body-sm">
              {[...listingsByNeighborhood.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([k, n]) => (
                  <li key={k} className="flex justify-between">
                    <span className="text-n-700">{k}</span>
                    <span className="tabular text-ink">{n}</span>
                  </li>
                ))}
              {listingsByNeighborhood.size === 0 ? <li className="text-n-500">Pas de données</li> : null}
            </ul>
          </CardBody></Card>
        </div>
      )}
    </div>
  );
}
