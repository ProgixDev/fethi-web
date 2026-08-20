"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/Pill";
import { messagesApi, type AdminThread } from "@/lib/api";
import { timeAgo } from "@/lib/utils/format";

export default function UserMessagesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [threads, setThreads] = React.useState<AdminThread[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;
    let alive = true;
    messagesApi
      .threadsForUser(id)
      .then((res) => {
        if (alive) setThreads(res);
      })
      .catch(() => {
        if (alive) setError("Impossible de charger les conversations.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <p className="text-body text-n-500">Chargement…</p>;

  if (error) {
    return (
      <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">{error}</div>
    );
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-5 w-5" />}
        title="Aucune conversation"
        description="Cet utilisateur n'a aucun échange (acheteur ou vendeur) pour l'instant."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
            <th className="px-4 py-2.5 text-left">Annonce</th>
            <th className="px-4 py-2.5 text-left">Rôle</th>
            <th className="px-4 py-2.5 text-left">Avec</th>
            <th className="px-4 py-2.5 text-left">Dernier message</th>
            <th className="px-4 py-2.5 text-left">Quand</th>
            <th className="px-4 py-2.5 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {threads.map((t) => (
            <tr key={t.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
              <td className="px-4 py-3 text-n-700 truncate max-w-xs">
                <Link href={`/listings/${t.listingId}`} className="hover:text-primary">
                  {t.listingTitle ?? "Annonce supprimée"}
                </Link>
              </td>
              <td className="px-4 py-3 text-n-700">
                {t.role === "buyer" ? "Acheteur" : "Vendeur"}
              </td>
              <td className="px-4 py-3 text-ink">{t.otherPartyName}</td>
              <td className="px-4 py-3 text-n-500 truncate max-w-xs">{t.lastMessage ?? "—"}</td>
              <td className="px-4 py-3 text-caption text-n-500">
                {t.lastMessageAt ? timeAgo(t.lastMessageAt) : "—"}
              </td>
              <td className="px-4 py-3">
                {t.unreadCount > 0 ? (
                  <Pill tone="primary" dot>
                    {t.unreadCount} non lu{t.unreadCount > 1 ? "s" : ""}
                  </Pill>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
