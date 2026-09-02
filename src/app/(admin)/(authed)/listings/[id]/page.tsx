"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Eye, Heart } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  listingsApi,
  publicUsersApi,
  reportsApi,
  type Listing,
  type PublicProfile,
  type Report,
  type ListingStatus,
} from "@/lib/api";
import { formatDate, initials } from "@/lib/utils/format";

const statusTone: Record<ListingStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  PENDING_REVIEW: "accent",
  PAUSED: "warning",
  SOLD: "neutral",
  ARCHIVED: "neutral",
};

const statusLabel: Record<ListingStatus, string> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En attente de validation",
  PAUSED: "En pause",
  SOLD: "Vendu",
  ARCHIVED: "Archivé",
};

function formatPrice(l: Listing) {
  const eur = (c: number | null | undefined) =>
    c != null ? `${(c / 100).toLocaleString("fr-FR")} €` : "";
  if (l.listingType === "LOCATION") return "À convenir par message";
  if (l.listingType === "SERVICE") {
    if (l.hourlyRateCents != null) return `${eur(l.hourlyRateCents)} / h`;
    if (l.flatRateCents != null) return eur(l.flatRateCents);
    return "Sur devis";
  }
  return l.priceCents != null && l.priceCents > 0 ? eur(l.priceCents) : "Gratuit";
}

export default function ListingDetailAdminPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [listing, setListing] = React.useState<Listing | null>(null);
  const [seller, setSeller] = React.useState<PublicProfile | null>(null);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionPending, setActionPending] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    listingsApi
      .get(id)
      .then(async (l) => {
        if (!alive) return;
        setListing(l);
        // Charge le seller + les reports en parallele
        Promise.all([
          publicUsersApi.get(l.ownerId).catch(() => null),
          reportsApi.list({ targetType: "LISTING", size: 50 }).catch(() => null),
        ]).then(([s, r]) => {
          if (!alive) return;
          setSeller(s);
          setReports((r?.content ?? []).filter((rep: Report) => rep.targetId === l.id));
        });
      })
      .catch(() => {
        if (alive) setListing(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const setStatus = async (next: ListingStatus) => {
    if (!listing) return;
    setActionPending(true);
    try {
      const updated = await listingsApi.setStatus(listing.id, next);
      setListing(updated);
    } catch (err) {
      alert("Échec: " + (err as Error).message);
    } finally {
      setActionPending(false);
    }
  };

  if (loading) {
    return (
      <div className="container-admin py-8">
        <p className="text-body text-n-500">Chargement…</p>
      </div>
    );
  }
  if (!listing) {
    notFound();
  }

  const photo = listing.photos?.[0];

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/listings", label: "Annonces" },
          { label: listing.title },
        ]}
        title={listing.title}
        description={`${listing.categoryLabel ?? "—"} · ${listing.listingType} · ${listing.neighborhood ?? "—"}`}
        actions={
          <div className="flex gap-2">
            {listing.status === "PENDING_REVIEW" ? (
              <>
                <Button size="sm" onClick={() => setStatus("ACTIVE")} disabled={actionPending}>
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setStatus("ARCHIVED")}
                  disabled={actionPending}
                >
                  Rejeter
                </Button>
              </>
            ) : (
              <>
                {listing.status === "ACTIVE" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setStatus("PAUSED")}
                    disabled={actionPending}
                  >
                    Mettre en pause
                  </Button>
                ) : listing.status === "PAUSED" ? (
                  <Button size="sm" onClick={() => setStatus("ACTIVE")} disabled={actionPending}>
                    Réactiver
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStatus("ARCHIVED")}
                  disabled={actionPending || listing.status === "ARCHIVED"}
                >
                  Archiver
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg border border-n-100 bg-n-100">
            {photo ? (
              <Image
                src={photo}
                alt={listing.title}
                fill
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
                priority
                unoptimized
              />
            ) : null}
          </div>

          <Card>
            <CardBody>
              <h3 className="text-h3 font-medium text-ink">Description</h3>
              <p className="mt-2 text-body text-n-700 whitespace-pre-line">
                {listing.description ?? "—"}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <h3 className="text-h3 font-medium text-ink">Signalements</h3>
                <span className="text-caption text-n-500">{reports.length} entrée(s)</span>
              </div>
              {reports.length === 0 ? (
                <p className="mt-3 text-body-sm text-n-500">Aucun signalement.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {reports.slice(0, 5).map((r) => (
                    <li key={r.id} className="rounded-md bg-paper px-3 py-2 text-body-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-ink">{r.reason}</span>
                        <Pill tone={r.status === "OPEN" ? "warning" : "neutral"}>{r.status}</Pill>
                      </div>
                      {r.details ? <p className="mt-1 text-n-700">{r.details}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Prix</span>
                <span className="text-h3 font-medium tabular text-ink">{formatPrice(listing)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Statut</span>
                <Pill tone={statusTone[listing.status]} dot>{statusLabel[listing.status]}</Pill>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">État</span>
                <span className="text-body-sm text-n-700">{listing.condition ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-caption text-n-500">Publiée le</span>
                <span className="text-body-sm text-n-700">{formatDate(listing.createdAt)}</span>
              </div>
              <hr className="border-n-100" />
              <div className="flex items-center justify-around text-caption text-n-500">
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" /> {listing.viewCount ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {listing.favoritesCount ?? 0}
                </span>
              </div>
            </CardBody>
          </Card>

          {seller ? (
            <Card>
              <CardBody className="space-y-3">
                <h3 className="text-h3 font-medium text-ink">Vendeur</h3>
                <Link href={`/users/${seller.id}`} className="flex items-center gap-3 hover:opacity-90">
                  <Avatar
                    initials={initials(seller.displayName ?? "?")}
                    seed={seller.id}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-ink truncate">
                      {seller.displayName ?? "Voisin·e"}
                    </p>
                    <p className="text-caption text-n-500">
                      {seller.neighborhood ?? "—"} ·{" "}
                      {seller.rating != null ? `${seller.rating.toFixed(1)}★` : "Nouveau"}
                    </p>
                  </div>
                </Link>
                <div className="grid grid-cols-3 gap-2 text-caption">
                  <div className="text-center">
                    <p className="text-n-500">Annonces</p>
                    <p className="font-medium text-ink">{seller.listingsCount ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-n-500">Ventes</p>
                    <p className="font-medium text-ink">{seller.salesCount ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-n-500">Avis</p>
                    <p className="font-medium text-ink">{seller.reviewsCount ?? 0}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
