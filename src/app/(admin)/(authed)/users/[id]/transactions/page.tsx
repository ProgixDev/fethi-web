"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { ordersApi, type AdminOrder } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const tone: Record<AdminOrder["status"], React.ComponentProps<typeof Pill>["tone"]> = {
  COMPLETED: "success",
  AWAITING_PICKUP: "warning",
  HANDOFF_PENDING: "info",
  DISPUTED: "danger",
  REFUNDED: "danger",
  CANCELLED: "neutral",
};

const label: Record<AdminOrder["status"], string> = {
  COMPLETED: "Finalisée",
  AWAITING_PICKUP: "En attente de remise",
  HANDOFF_PENDING: "Remise en cours",
  DISPUTED: "Litige",
  REFUNDED: "Remboursée",
  CANCELLED: "Annulée",
};

function formatEur(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

export default function UserTransactionsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    // On charge en parallele les orders ou l'user est buyer ou seller.
    Promise.all([
      ordersApi.list({ buyerId: id, size: 50 }).catch(() => null),
      ordersApi.list({ sellerId: id, size: 50 }).catch(() => null),
    ]).then(([asBuyer, asSeller]) => {
      if (!alive) return;
      const all = [...(asBuyer?.content ?? []), ...(asSeller?.content ?? [])];
      // De-dup par id
      const seen = new Set<string>();
      const unique = all.filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
      unique.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setOrders(unique);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="text-body text-n-500">Chargement…</p>;
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-5 w-5" />}
        title="Aucune transaction"
        description="Cet utilisateur n'a ni acheté ni vendu pour l'instant."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
            <th className="px-4 py-2.5 text-left">Référence</th>
            <th className="px-4 py-2.5 text-left">Rôle</th>
            <th className="px-4 py-2.5 text-left">Annonce</th>
            <th className="px-4 py-2.5 text-left">Montant</th>
            <th className="px-4 py-2.5 text-left">Statut</th>
            <th className="px-4 py-2.5 text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
              <td className="px-4 py-3 font-medium text-ink">
                <Link href={`/orders/${o.id}`} className="hover:text-primary">
                  #{o.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3 text-n-700">
                {o.buyerId === id ? "Acheteur" : "Vendeur"}
              </td>
              <td className="px-4 py-3 text-n-700 truncate max-w-xs">
                {o.listingTitleSnapshot ?? "—"}
              </td>
              <td className="px-4 py-3 tabular text-ink">{formatEur(o.amountCents)}</td>
              <td className="px-4 py-3">
                <Pill tone={tone[o.status]} dot>{label[o.status]}</Pill>
              </td>
              <td className="px-4 py-3 text-caption text-n-500">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
