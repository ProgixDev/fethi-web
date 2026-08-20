"use client";

import * as React from "react";
import { Tags } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { categoriesApi, type Category } from "@/lib/api";

export default function ListingsCategoriesPage() {
  const [items, setItems] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    categoriesApi.list({ size: 200 })
      .then((res) => { if (alive) setItems(res.content); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const byType = React.useMemo(() => {
    const groups: Record<string, Category[]> = {};
    for (const c of items) {
      const k = c.type;
      if (!groups[k]) groups[k] = [];
      groups[k].push(c);
    }
    return groups;
  }, [items]);

  const typeLabel: Record<string, string> = { VENTE: "Vente", LOCATION: "Location", SERVICE: "Service" };

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/listings", label: "Annonces" },
          { label: "Catégories" },
        ]}
        title="Catégories"
        description={`${items.length} catégorie(s) au total.`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : (
        <div className="space-y-6">
          {(Object.keys(byType) as Array<keyof typeof typeLabel>).map((t) => (
            <Card key={t}>
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <Tags className="h-4 w-4 text-n-500" />
                  <h3 className="text-h3 font-medium text-ink">{typeLabel[t] ?? t}</h3>
                  <Pill tone="neutral">{byType[t].length}</Pill>
                </div>
                <div className="flex flex-wrap gap-2">
                  {byType[t].map((c) => (
                    <span key={c.id} className="px-3 py-1.5 rounded-full bg-paper border border-n-200 text-body-sm text-ink">
                      {c.label}
                      {c.subtitle ? <span className="text-n-500"> · {c.subtitle}</span> : null}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
