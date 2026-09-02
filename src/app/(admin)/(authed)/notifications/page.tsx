"use client";

import * as React from "react";
import Link from "next/link";
import {
  IdCard,
  Scale,
  Banknote,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { listingsApi } from "@/lib/api";
import { timeAgo } from "@/lib/utils/format";

type Notif = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  title: string;
  body: string;
  at: string;
  href?: string;
};

// Aucun flux d'alertes operationnelles admin cote backend (distinct de la
// table `notifications`, qui sert les notifications utilisateur mobile) —
// exemples illustratifs uniquement. La carte "Annonces en attente" ci-dessous
// est la seule EXCEPTION : elle est réelle (WEB-023 / issue #69) — l'exemple
// précédent ("Annonces en attente de modération", jamais cliquable, sans
// compte réel) était exactement ce qui a fait confusion dans l'issue #69.
const exampleAlerts: Notif[] = [
  {
    id: "n1",
    icon: IdCard,
    iconTone: "bg-info-soft text-info",
    title: "KYC en attente de revue",
    body: "Exemple d'alerte — délai SLA : 24 h.",
    at: "2026-05-04T13:42:00Z",
  },
  {
    id: "n2",
    icon: Scale,
    iconTone: "bg-danger-soft text-danger",
    title: "Nouveau litige ouvert",
    body: "Exemple d'alerte de litige.",
    at: "2026-05-04T11:42:00Z",
  },
  {
    id: "n3",
    icon: Banknote,
    iconTone: "bg-primary-soft text-primary-ink",
    title: "Versements programmés",
    body: "Exemple d'alerte de cycle de versement.",
    at: "2026-05-04T08:00:00Z",
  },
];

export default function AdminNotificationsPage() {
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    listingsApi
      .moderationQueue({ status: "PENDING_REVIEW", size: 1 })
      .then((res) => {
        if (alive) setPendingCount(res.totalElements);
      })
      .catch(() => {
        if (alive) setPendingCount(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const listingsAlert: Notif | null =
    pendingCount && pendingCount > 0
      ? {
          id: "listings-pending",
          icon: Clock,
          iconTone: "bg-warning-soft text-warning",
          title: `${pendingCount} annonce${pendingCount > 1 ? "s" : ""} en attente de validation`,
          body: "Des annonces ont été soumises et attendent une décision (approuver/rejeter) avant de pouvoir être publiées.",
          at: new Date().toISOString(),
          href: "/listings/pending",
        }
      : null;

  const items = listingsAlert ? [listingsAlert, ...exampleAlerts] : exampleAlerts;

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { label: "Notifications" },
        ]}
        title="Notifications"
        description="Aucun flux d'alertes opérationnelles connecté pour l'instant."
        actions={
          <Button variant="outline" size="sm" disabled title="Pas encore connecté à un backend">
            Tout marquer comme lu
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas de flux d&apos;alertes opérationnelles pour le staff (à ne pas
          confondre avec la table <code>notifications</code>, qui sert les notifications des
          utilisateurs mobile). La carte « annonces en attente » ci-dessous est réelle et
          cliquable ; les autres sont des exemples illustratifs, pas des données réelles.
        </p>
      </NotConnectedNotice>

      <ul className="divide-y divide-n-100 rounded-lg border border-n-100 bg-surface">
        {items.map((n) => {
          const Icon = n.icon;
          const content = (
            <>
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${n.iconTone}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-body font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-body-sm text-n-700">{n.body}</p>
                <p className="mt-1 text-caption text-n-500">{timeAgo(n.at)}</p>
              </div>
            </>
          );
          return n.href ? (
            <li key={n.id} data-testid="notif-listings-pending">
              <Link href={n.href} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-n-50">
                {content}
              </Link>
            </li>
          ) : (
            <li key={n.id} className="flex items-start gap-3 px-5 py-4">
              {content}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
