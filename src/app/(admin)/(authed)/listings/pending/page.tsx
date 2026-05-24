"use client";

import * as React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { listingsApi, type Listing } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function eur(c: number | null | undefined) { return c == null ? "—" : `${(c / 100).toLocaleString("fr-FR")} €`; }

export default function ListingsPendingPage() {
  const [items, setItems] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    listingsApi.list({ status: "DRAFT", size: 100 })
      .then((res) => { if (alive) setItems(res.content); })
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
          { label: "En attente" },
        ]}
        title="Annonces en attente"
        description={`${items.length} brouillon(s) à modérer.`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : items.length === 0 ? (
        <EmptyState icon={<Clock className="h-5 w-5" />} title="Aucun brouillon" description="Toutes les annonces sont publiées." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
                <th className="px-4 py-2.5 text-left">Annonce</th>
                <th className="px-4 py-2.5 text-left">Catégorie</th>
                <th className="px-4 py-2.5 text-left">Prix</th>
                <th className="px-4 py-2.5 text-left">Créée le</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr key={l.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3">
                    <Link href={`/listings/${l.id}`} className="font-medium text-ink hover:text-primary">{l.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-n-700">{l.categoryLabel ?? "—"}</td>
                  <td className="px-4 py-3 tabular text-ink">{eur(l.priceCents)}</td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
