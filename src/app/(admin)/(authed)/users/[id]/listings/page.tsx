"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Tag } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { listingsApi, type Listing } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function formatEur(cents: number | null | undefined) {
  if (cents == null) return "—";
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

const tone: Record<Listing["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  DRAFT: "neutral",
  PENDING_REVIEW: "accent",
  PAUSED: "warning",
  SOLD: "neutral",
  ARCHIVED: "neutral",
};

export default function UserListingsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [items, setItems] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    listingsApi
      .list({ ownerId: id, size: 100 })
      .then((res) => {
        if (alive) setItems(res.content);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="text-body text-n-500">Chargement…</p>;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Tag className="h-5 w-5" />}
        title="Aucune annonce publiée"
        description="Cet utilisateur n'a encore rien mis en vente."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
            <th className="px-4 py-2.5 text-left">Annonce</th>
            <th className="px-4 py-2.5 text-left">Catégorie</th>
            <th className="px-4 py-2.5 text-left">Prix</th>
            <th className="px-4 py-2.5 text-left">Statut</th>
            <th className="px-4 py-2.5 text-left">Vues · ❤</th>
            <th className="px-4 py-2.5 text-left">Publiée</th>
          </tr>
        </thead>
        <tbody>
          {items.map((l) => (
            <tr key={l.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
              <td className="px-4 py-3">
                <Link href={`/listings/${l.id}`} className="font-medium text-ink hover:text-primary">
                  {l.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-n-700">{l.categoryLabel ?? "—"}</td>
              <td className="px-4 py-3 tabular text-ink">{formatEur(l.priceCents)}</td>
              <td className="px-4 py-3">
                <Pill tone={tone[l.status]} dot>{l.status}</Pill>
              </td>
              <td className="px-4 py-3 tabular text-n-700">
                {l.viewCount ?? 0} · {l.favoritesCount ?? 0}
              </td>
              <td className="px-4 py-3 text-caption text-n-500">{formatDate(l.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
