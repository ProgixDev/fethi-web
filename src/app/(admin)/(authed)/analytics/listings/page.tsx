"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { KPIStat } from "@/components/ui/KPIStat";
import { listingsApi, type Listing } from "@/lib/api";

export default function AnalyticsListingsPage() {
  const [items, setItems] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    listingsApi.list({ size: 500 })
      .then((res) => { if (alive) setItems(res.content); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const byType = React.useMemo(() => ({
    VENTE: items.filter((l) => l.listingType === "VENTE").length,
    LOCATION: items.filter((l) => l.listingType === "LOCATION").length,
    SERVICE: items.filter((l) => l.listingType === "SERVICE").length,
  }), [items]);

  const byStatus = React.useMemo(() => ({
    ACTIVE: items.filter((l) => l.status === "ACTIVE").length,
    DRAFT: items.filter((l) => l.status === "DRAFT").length,
    PAUSED: items.filter((l) => l.status === "PAUSED").length,
    SOLD: items.filter((l) => l.status === "SOLD").length,
    ARCHIVED: items.filter((l) => l.status === "ARCHIVED").length,
  }), [items]);

  const topCategories = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const l of items) {
      const k = l.categoryLabel ?? "—";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [items]);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Analytics annonces" }]}
        title="Annonces"
        description={`${items.length} annonce(s) analysées.`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <KPIStat label="Ventes" value={byType.VENTE} />
            <KPIStat label="Locations" value={byType.LOCATION} />
            <KPIStat label="Services" value={byType.SERVICE} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card><CardBody>
              <h3 className="text-h3 font-medium text-ink mb-3">Par statut</h3>
              <ul className="space-y-2 text-body-sm">
                {(Object.keys(byStatus) as Array<keyof typeof byStatus>).map((k) => (
                  <li key={k} className="flex justify-between"><span className="text-n-700">{k}</span><span className="tabular text-ink">{byStatus[k]}</span></li>
                ))}
              </ul>
            </CardBody></Card>
            <Card><CardBody>
              <h3 className="text-h3 font-medium text-ink mb-3">Top catégories</h3>
              <ul className="space-y-2 text-body-sm">
                {topCategories.map(([k, n]) => (
                  <li key={k} className="flex justify-between"><span className="text-n-700">{k}</span><span className="tabular text-ink">{n}</span></li>
                ))}
              </ul>
            </CardBody></Card>
          </div>
        </>
      )}
    </div>
  );
}
