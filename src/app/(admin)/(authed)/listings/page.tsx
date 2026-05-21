"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DataTable } from "@/components/admin/tables/DataTable";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody } from "@/components/ui/Card";
import {
  listingsApi,
  type Listing,
  type ListingStatus,
  type ListingType,
} from "@/lib/api";
import { formatDate, initials } from "@/lib/utils/format";

const statusTone: Record<ListingStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  PAUSED: "warning",
  SOLD: "neutral",
  ARCHIVED: "neutral",
};
const statusLabel: Record<ListingStatus, string> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  PAUSED: "En pause",
  SOLD: "Vendu",
  ARCHIVED: "Archivé",
};

const typeLabel: Record<ListingType, string> = {
  VENTE: "Vente",
  LOCATION: "Location",
  SERVICE: "Service",
};

function formatListingPrice(l: Listing): string {
  const eur = (cents: number | null | undefined) =>
    cents != null ? `${(cents / 100).toLocaleString("fr-FR")} €` : "";
  if (l.listingType === "LOCATION") {
    return l.pricePerDayCents != null ? `${eur(l.pricePerDayCents)}/j` : "Sur demande";
  }
  if (l.listingType === "SERVICE") {
    if (l.hourlyRateCents != null) return `${eur(l.hourlyRateCents)}/h`;
    if (l.flatRateCents != null) return eur(l.flatRateCents);
    return "Sur devis";
  }
  return l.priceCents != null && l.priceCents > 0 ? eur(l.priceCents) : "Gratuit";
}

export default function ListingsPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<ListingStatus | "all">("all");
  const [typeFilter, setTypeFilter] = React.useState<ListingType | "all">("all");
  const [data, setData] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    listingsApi
      .list({
        q: query || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        listingType: typeFilter === "all" ? undefined : typeFilter,
        size: 100,
      })
      .then((res) => {
        if (alive) setData(res.content);
      })
      .catch((err) => {
        if (alive) setError(err?.message ?? "Chargement impossible");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, statusFilter, typeFilter]);

  const columns = React.useMemo<ColumnDef<Listing>[]>(
    () => [
      {
        id: "title",
        header: "Annonce",
        accessorKey: "title",
        size: 320,
        cell: ({ row }) => {
          const photo = row.original.photos?.[0];
          return (
            <div className="flex items-center gap-3">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md bg-n-100">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </span>
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-ink truncate">
                  {row.original.title}
                </p>
                <p className="text-caption text-n-500 truncate">
                  {row.original.categoryLabel ?? "—"} · {typeLabel[row.original.listingType]}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "seller",
        header: "Vendeur",
        cell: ({ row }) => {
          const owner = row.original.owner;
          if (!owner) return <span className="text-n-400">—</span>;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar initials={initials(owner.displayName ?? "?")} seed={owner.id} size="xs" />
              <span className="text-body-sm text-n-700 truncate">
                {owner.displayName ?? "Voisin·e"}
              </span>
            </div>
          );
        },
      },
      {
        id: "price",
        header: "Prix",
        cell: ({ row }) => (
          <span className="text-body-sm tabular text-ink">{formatListingPrice(row.original)}</span>
        ),
      },
      {
        id: "neighborhood",
        header: "Quartier",
        accessorKey: "neighborhood",
        cell: ({ row }) => (
          <span className="text-body-sm text-n-700">
            {row.original.neighborhood ?? <span className="text-n-400">—</span>}
          </span>
        ),
      },
      {
        id: "stats",
        header: "Vues · ❤",
        cell: ({ row }) => (
          <span className="text-caption text-n-500 tabular">
            {row.original.viewCount ?? 0} · {row.original.favoritesCount ?? 0}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Publiée le",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-caption text-n-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => (
          <Pill tone={statusTone[row.original.status]} dot>
            {statusLabel[row.original.status]}
          </Pill>
        ),
      },
    ],
    [],
  );

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Annonces" }]}
        title="Annonces"
        description={`${data.length} ${data.length > 1 ? "annonces" : "annonce"} affichées.`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Titre, description…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.currentTarget.value as ListingStatus | "all")}
          className="w-40"
        >
          <option value="all">Tous statuts</option>
          {(Object.keys(statusLabel) as ListingStatus[]).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </Select>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.currentTarget.value as ListingType | "all")}
          className="w-40"
        >
          <option value="all">Tous types</option>
          {(Object.keys(typeLabel) as ListingType[]).map((tt) => (
            <option key={tt} value={tt}>
              {typeLabel[tt]}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <Card>
          <CardBody>
            <p className="text-body-sm text-danger">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        globalFilter={query}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/listings/${r.id}`)}
        empty={loading ? "Chargement…" : "Aucune annonce trouvée."}
      />
    </div>
  );
}
