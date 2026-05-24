"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { Scale } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { ordersApi, type AdminOrder } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function eur(c: number | null | undefined) { return c == null ? "—" : `${(c / 100).toLocaleString("fr-FR")} €`; }

export default function DisputeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = React.useState<AdminOrder | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    ordersApi.get(id).then((o) => { if (alive) setOrder(o); }).catch(() => alive && setOrder(null)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="container-admin py-8"><p className="text-body text-n-500">Chargement…</p></div>;
  if (!order) notFound();

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/disputes", label: "Litiges" },
          { label: `#${order.id.slice(0, 8)}` },
        ]}
        title={`Litige #${order.id.slice(0, 8)}`}
        description={order.listingTitleSnapshot ?? "—"}
      />

      <Card><CardBody className="flex items-center gap-3">
        <Scale className="h-5 w-5 text-danger" />
        <div>
          <p className="text-body-sm text-ink">Cette commande est en litige.</p>
          <p className="text-caption text-n-500">Montant : {eur(order.amountCents)} · Créée le {formatDate(order.createdAt)}</p>
        </div>
        <Pill tone="danger" dot className="ml-auto">{order.status}</Pill>
      </CardBody></Card>

      <div className="text-body-sm">
        <Link href={`/orders/${order.id}`} className="text-primary hover:underline">Voir la commande complète →</Link>
      </div>
    </div>
  );
}
