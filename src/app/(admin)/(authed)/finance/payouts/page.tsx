"use client";

import * as React from "react";
import Link from "next/link";
import { Banknote } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ordersApi, type AdminOrder } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function eur(c: number) { return `${(c / 100).toLocaleString("fr-FR")} €`; }

// V1 : on liste les commandes COMPLETED comme "à verser au vendeur".
// V2 : remplacer par un endpoint /admin/payouts dédié + Stripe Connect.
export default function PayoutsPage() {
  const [items, setItems] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    ordersApi.list({ status: "COMPLETED", size: 100 })
      .then((res) => { if (alive) setItems(res.content); })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const total = items.reduce((acc, o) => acc + (o.amountCents - o.feeCents), 0);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/finance", label: "Finance" },
          { label: "Versements" },
        ]}
        title="Versements"
        description="Sommes à reverser aux vendeurs (net des commissions plateforme)."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Card><CardBody>
          <p className="text-caption text-n-500">À verser</p>
          <p className="mt-1 text-h2 font-medium tabular text-ink">{eur(total)}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-caption text-n-500">Commandes éligibles</p>
          <p className="mt-1 text-h2 font-medium tabular text-ink">{items.length}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-caption text-n-500">Mode</p>
          <p className="mt-1 text-h2 font-medium text-ink">Manuel</p>
          <p className="text-caption text-n-500">Stripe Connect bientôt</p>
        </CardBody></Card>
      </div>

      {loading ? <p className="text-body text-n-500">Chargement…</p> : items.length === 0 ? (
        <EmptyState icon={<Banknote className="h-5 w-5" />} title="Pas de versement" description="Aucune commande finalisée à payer." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead><tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Commande</th>
              <th className="px-4 py-2.5 text-left">Vendeur</th>
              <th className="px-4 py-2.5 text-left">Brut</th>
              <th className="px-4 py-2.5 text-left">Commission</th>
              <th className="px-4 py-2.5 text-left">À verser</th>
              <th className="px-4 py-2.5 text-left">Date</th>
            </tr></thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3"><Link href={`/orders/${o.id}`} className="font-medium tabular hover:text-primary">#{o.id.slice(0, 8)}</Link></td>
                  <td className="px-4 py-3"><Link href={`/users/${o.sellerId}`} className="text-n-700 hover:text-primary">{o.sellerId.slice(0, 8)}</Link></td>
                  <td className="px-4 py-3 tabular text-ink">{eur(o.amountCents)}</td>
                  <td className="px-4 py-3 tabular text-n-500">-{eur(o.feeCents)}</td>
                  <td className="px-4 py-3 tabular text-success font-medium">{eur(o.amountCents - o.feeCents)}</td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(o.completedAt ?? o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
