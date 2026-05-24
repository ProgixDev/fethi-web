"use client";

import * as React from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { listingsApi, type Listing } from "@/lib/api";

function eur(c: number | null | undefined) { return c == null ? "—" : `${(c / 100).toLocaleString("fr-FR")} €`; }

export default function ListingsFeaturedPage() {
  const [items, setItems] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    listingsApi.list({ status: "ACTIVE", size: 100 })
      .then((res) => {
        const sorted = [...res.content].sort((a, b) => {
          const sa = (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0);
          if (sa !== 0) return sa;
          return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        });
        if (alive) setItems(sorted.slice(0, 30));
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/listings", label: "Annonces" },
          { label: "Mises en avant" },
        ]}
        title="Annonces vedettes"
        description="Top 30 annonces par engagement (favoris + vues)."
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : items.length === 0 ? (
        <EmptyState icon={<Star className="h-5 w-5" />} title="Aucune annonce active" description="Reviens quand les annonces auront des engagements." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead><tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Rang</th>
              <th className="px-4 py-2.5 text-left">Annonce</th>
              <th className="px-4 py-2.5 text-left">Prix</th>
              <th className="px-4 py-2.5 text-left">Vues</th>
              <th className="px-4 py-2.5 text-left">Favoris</th>
            </tr></thead>
            <tbody>
              {items.map((l, i) => (
                <tr key={l.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3 font-medium tabular text-ink">#{i + 1}</td>
                  <td className="px-4 py-3"><Link href={`/listings/${l.id}`} className="text-ink hover:text-primary">{l.title}</Link></td>
                  <td className="px-4 py-3 tabular text-ink">{eur(l.priceCents)}</td>
                  <td className="px-4 py-3 tabular text-n-700">{l.viewCount ?? 0}</td>
                  <td className="px-4 py-3 tabular text-n-700">{l.favoritesCount ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
