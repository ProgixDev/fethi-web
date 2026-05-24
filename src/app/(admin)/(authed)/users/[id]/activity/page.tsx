"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, Tag, ShoppingBag } from "lucide-react";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { listingsApi, ordersApi, type Listing, type AdminOrder } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

type Event =
  | { type: "listing"; at: string; data: Listing }
  | { type: "order"; at: string; data: AdminOrder; role: "buyer" | "seller" };

export default function UserActivityPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    Promise.all([
      listingsApi.list({ ownerId: id, size: 30 }).catch(() => null),
      ordersApi.list({ buyerId: id, size: 30 }).catch(() => null),
      ordersApi.list({ sellerId: id, size: 30 }).catch(() => null),
    ]).then(([l, b, s]) => {
      if (!alive) return;
      const list: Event[] = [];
      (l?.content ?? []).forEach((x) => list.push({ type: "listing", at: x.createdAt, data: x }));
      (b?.content ?? []).forEach((o) => list.push({ type: "order", at: o.createdAt, data: o, role: "buyer" }));
      (s?.content ?? []).forEach((o) => list.push({ type: "order", at: o.createdAt, data: o, role: "seller" }));
      list.sort((a, b) => b.at.localeCompare(a.at));
      setEvents(list.slice(0, 50));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [id]);

  if (loading) return <p className="text-body text-n-500">Chargement…</p>;
  if (events.length === 0) {
    return <EmptyState icon={<Activity className="h-5 w-5" />} title="Pas d'activité" description="Cet utilisateur n'a aucune trace pour le moment." />;
  }

  return (
    <Card><CardBody>
      <ul className="divide-y divide-n-100">
        {events.map((e, i) => (
          <li key={i} className="py-3 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-n-100 text-n-700">
              {e.type === "listing" ? <Tag className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
            </span>
            <div className="flex-1 min-w-0">
              {e.type === "listing" ? (
                <>
                  <p className="text-body-sm text-ink">A publié <Link href={`/listings/${e.data.id}`} className="font-medium hover:text-primary">{e.data.title}</Link></p>
                  <p className="text-caption text-n-500">{formatDate(e.at)}</p>
                </>
              ) : (
                <>
                  <p className="text-body-sm text-ink">
                    {e.role === "buyer" ? "A acheté" : "A vendu"} <Link href={`/orders/${e.data.id}`} className="font-medium hover:text-primary">#{e.data.id.slice(0, 8)}</Link>
                  </p>
                  <p className="text-caption text-n-500">{e.data.listingTitleSnapshot ?? "—"} · {formatDate(e.at)}</p>
                </>
              )}
            </div>
            {e.type === "order" ? <Pill tone={e.data.status === "COMPLETED" ? "success" : "neutral"}>{e.data.status}</Pill> : null}
          </li>
        ))}
      </ul>
    </CardBody></Card>
  );
}
