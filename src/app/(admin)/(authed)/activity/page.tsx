"use client";

import * as React from "react";
import Link from "next/link";
import { Tag, ShoppingBag, Flag } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { listingsApi, ordersApi, reportsApi, type Listing, type AdminOrder, type Report } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

type Event = { type: "listing" | "order" | "report"; at: string; title: string; href: string };

const icon: Record<Event["type"], React.ReactNode> = {
  listing: <Tag className="h-3.5 w-3.5" />,
  order: <ShoppingBag className="h-3.5 w-3.5" />,
  report: <Flag className="h-3.5 w-3.5" />,
};

export default function ActivityPage() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    Promise.all([
      listingsApi.list({ size: 20, sort: "createdAt,desc" }).catch(() => null),
      ordersApi.list({ size: 20 }).catch(() => null),
      reportsApi.list({ size: 20 }).catch(() => null),
    ]).then(([l, o, r]) => {
      if (!alive) return;
      const list: Event[] = [];
      (l?.content ?? []).forEach((x: Listing) => list.push({ type: "listing", at: x.createdAt, title: `Annonce: ${x.title}`, href: `/listings/${x.id}` }));
      (o?.content ?? []).forEach((x: AdminOrder) => list.push({ type: "order", at: x.createdAt, title: `Commande #${x.id.slice(0,8)} — ${x.listingTitleSnapshot ?? "—"}`, href: `/orders/${x.id}` }));
      (r?.content ?? []).forEach((x: Report) => list.push({ type: "report", at: x.createdAt, title: `Signalement: ${x.reason}`, href: `/moderation/${x.id}` }));
      list.sort((a, b) => b.at.localeCompare(a.at));
      setEvents(list.slice(0, 50));
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Activité" }]}
        title="Activité"
        description="Évènements récents agrégés depuis l'API (annonces, commandes, signalements)."
      />
      {loading ? <p className="text-body text-n-500">Chargement…</p> : (
        <Card><CardBody>
          <ul className="divide-y divide-n-100">
            {events.map((e, i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-n-100 text-n-700">{icon[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <Link href={e.href} className="text-body-sm font-medium text-ink hover:text-primary">{e.title}</Link>
                  <p className="text-caption text-n-500">{formatDate(e.at)}</p>
                </div>
                <Pill tone="neutral">{e.type}</Pill>
              </li>
            ))}
          </ul>
        </CardBody></Card>
      )}
    </div>
  );
}
