"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { ordersApi, publicUsersApi, type AdminOrder, type PublicProfile } from "@/lib/api";
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
function eur(c: number | null | undefined) { return c == null ? "—" : `${(c / 100).toLocaleString("fr-FR")} €`; }

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = React.useState<AdminOrder | null>(null);
  const [buyer, setBuyer] = React.useState<PublicProfile | null>(null);
  const [seller, setSeller] = React.useState<PublicProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refunding, setRefunding] = React.useState(false);
  const [refundMsg, setRefundMsg] = React.useState<string | null>(null);

  const canRefund =
    order != null &&
    order.paymentIntentId != null &&
    order.status !== "REFUNDED" &&
    order.status !== "CANCELLED";

  async function handleRefund() {
    if (!order) return;
    setRefunding(true);
    setRefundMsg(null);
    try {
      const updated = await ordersApi.refund(order.id);
      setOrder(updated);
      setRefundMsg(
        "Remboursement initié auprès de Stripe. Le statut passera à « Remboursée » à la réception du webhook.",
      );
    } catch (e) {
      setRefundMsg(e instanceof Error ? e.message : "Le remboursement a échoué.");
    } finally {
      setRefunding(false);
    }
  }

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    ordersApi.get(id).then(async (o) => {
      if (!alive) return;
      setOrder(o);
      Promise.all([
        publicUsersApi.get(o.buyerId).catch(() => null),
        publicUsersApi.get(o.sellerId).catch(() => null),
      ]).then(([b, s]) => { if (alive) { setBuyer(b); setSeller(s); } });
    }).catch(() => alive && setOrder(null)).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="container-admin py-8"><p className="text-body text-n-500">Chargement…</p></div>;
  if (!order) notFound();

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/orders", label: "Commandes" },
          { label: `#${order.id.slice(0, 8)}` },
        ]}
        title={`Commande #${order.id.slice(0, 8)}`}
        description={order.listingTitleSnapshot ?? "—"}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Card><CardBody className="space-y-2">
            <h3 className="text-h3 font-medium text-ink">Montants</h3>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between"><dt className="text-n-500">Montant</dt><dd className="tabular text-ink">{eur(order.amountCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-n-500">Commission</dt><dd className="tabular text-ink">{eur(order.feeCents)}</dd></div>
              {order.depositCents ? <div className="flex justify-between"><dt className="text-n-500">Caution</dt><dd className="tabular text-ink">{eur(order.depositCents)}</dd></div> : null}
            </dl>
          </CardBody></Card>

          <Card><CardBody className="space-y-2">
            <h3 className="text-h3 font-medium text-ink">Paiement Stripe</h3>
            <dl className="space-y-2 text-body-sm">
              <div className="flex justify-between"><dt className="text-n-500">Intent ID</dt><dd className="text-ink font-mono text-caption">{order.paymentIntentId ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-n-500">Statut</dt><dd className="text-ink">{order.paymentStatus ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-n-500">Payé le</dt><dd className="text-ink">{order.paidAt ? formatDate(order.paidAt) : "—"}</dd></div>
            </dl>
          </CardBody></Card>

          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Remise</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-paper p-3 flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${order.buyerConfirmed ? "text-success" : "text-n-300"}`} />
                <span className="text-body-sm text-n-700">Acheteur {order.buyerConfirmed ? "confirmé" : "en attente"}</span>
              </div>
              <div className="rounded-md bg-paper p-3 flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${order.sellerConfirmed ? "text-success" : "text-n-300"}`} />
                <span className="text-body-sm text-n-700">Vendeur {order.sellerConfirmed ? "confirmé" : "en attente"}</span>
              </div>
            </div>
          </CardBody></Card>
        </div>

        <div className="space-y-6">
          <Card><CardBody className="space-y-3">
            <div className="flex justify-between"><span className="text-caption text-n-500">Statut</span><Pill tone={tone[order.status]} dot>{label[order.status]}</Pill></div>
            <div className="flex justify-between"><span className="text-caption text-n-500">Type</span><span className="text-body-sm text-n-700">{order.listingType}</span></div>
            <div className="flex justify-between"><span className="text-caption text-n-500">Créée le</span><span className="text-body-sm text-n-700">{formatDate(order.createdAt)}</span></div>
            {order.completedAt ? <div className="flex justify-between"><span className="text-caption text-n-500">Terminée</span><span className="text-body-sm text-n-700">{formatDate(order.completedAt)}</span></div> : null}
          </CardBody></Card>

          <Card><CardBody className="space-y-3">
            <h3 className="text-h3 font-medium text-ink">Remboursement</h3>
            <p className="text-caption text-n-500">
              Émet un remboursement Stripe idempotent. Le webhook Stripe reste la
              source de vérité et fait passer la commande à « Remboursée ».
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefund}
              disabled={!canRefund || refunding}
            >
              {refunding
                ? "Remboursement…"
                : order.status === "REFUNDED"
                  ? "Déjà remboursée"
                  : "Rembourser la commande"}
            </Button>
            {refundMsg ? <p className="text-caption text-n-600">{refundMsg}</p> : null}
          </CardBody></Card>

          <Card><CardBody>
            <h3 className="text-h3 font-medium text-ink mb-3">Parties</h3>
            <div className="space-y-3 text-body-sm">
              <div><p className="text-caption text-n-500">Acheteur</p><Link href={`/users/${order.buyerId}`} className="text-ink hover:text-primary">{buyer?.displayName ?? `#${order.buyerId.slice(0,8)}`}</Link></div>
              <div><p className="text-caption text-n-500">Vendeur</p><Link href={`/users/${order.sellerId}`} className="text-ink hover:text-primary">{seller?.displayName ?? `#${order.sellerId.slice(0,8)}`}</Link></div>
              <div><p className="text-caption text-n-500">Annonce</p><Link href={`/listings/${order.listingId}`} className="text-ink hover:text-primary">{order.listingTitleSnapshot ?? "Voir"}</Link></div>
            </div>
          </CardBody></Card>
        </div>
      </div>
    </div>
  );
}
