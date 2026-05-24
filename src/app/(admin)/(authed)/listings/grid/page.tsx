"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { listingsApi, type Listing } from "@/lib/api";

function eur(c: number | null | undefined) { return c == null ? "—" : `${(c / 100).toLocaleString("fr-FR")} €`; }

const toneByStatus: Record<Listing["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  PAUSED: "warning",
  SOLD: "neutral",
  ARCHIVED: "neutral",
};

export default function ListingsGridPage() {
  const [items, setItems] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    listingsApi.list({ size: 60 })
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
          { label: "Grille" },
        ]}
        title="Annonces en grille"
        description={`${items.length} annonce(s) affichées.`}
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((l) => {
            const photo = l.photos?.[0];
            return (
              <Link key={l.id} href={`/listings/${l.id}`} className="group rounded-lg border border-n-100 bg-surface overflow-hidden hover:shadow-medium transition">
                <div className="relative aspect-[4/3] bg-n-100">
                  {photo ? (
                    <Image src={photo} alt={l.title} fill sizes="280px" className="object-cover" unoptimized />
                  ) : null}
                  <div className="absolute top-2 right-2">
                    <Pill tone={toneByStatus[l.status]} dot>{l.status}</Pill>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-body-sm text-ink truncate">{l.title}</p>
                  <p className="text-caption text-n-500 truncate">{l.neighborhood ?? "—"} · {l.categoryLabel ?? "—"}</p>
                  <p className="mt-1 text-body-sm font-medium tabular text-ink">{eur(l.priceCents)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
