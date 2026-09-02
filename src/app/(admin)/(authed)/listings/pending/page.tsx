"use client";

import * as React from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { listingsApi, type ModerationListing } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function eur(c: number | null | undefined) { return c == null ? "—" : `${(c / 100).toLocaleString("fr-FR")} €`; }

/**
 * Pre-publish approval queue (WEB-023). Every listing lands here on first
 * submission (status PENDING_REVIEW) and stays invisible to the public until
 * a moderator approves it. Approve → ACTIVE, Reject → ARCHIVED, both via the
 * same audited `listingsApi.setStatus` path as the general moderation queue.
 */
export default function ListingsPendingPage() {
  const [items, setItems] = React.useState<ModerationListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const fetchQueue = React.useCallback((signal?: { aborted: boolean }) => {
    return listingsApi
      .moderationQueue({ status: "PENDING_REVIEW", size: 100 })
      .then((res) => {
        if (!signal?.aborted) {
          setItems(res.content);
          setError(null);
        }
      })
      .catch((e: { message?: string }) => {
        if (!signal?.aborted) setError(e?.message ?? "Chargement impossible");
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  React.useEffect(() => {
    const signal = { aborted: false };
    fetchQueue(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchQueue]);

  async function decide(id: string, next: "ACTIVE" | "ARCHIVED") {
    setPendingId(id);
    setError(null);
    try {
      await listingsApi.setStatus(id, next);
      setLoading(true);
      await fetchQueue();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Action impossible.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="container-admin py-8 space-y-6" data-testid="pending-queue">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/listings", label: "Annonces" },
          { label: "En attente" },
        ]}
        title="Annonces en attente de validation"
        description={
          loading
            ? "Chargement…"
            : `${items.length} annonce(s) soumise(s), invisible(s) au public tant qu'elles ne sont pas approuvées.`
        }
      />

      {error ? (
        <div
          data-testid="pending-error"
          className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-body text-n-500">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="Aucune annonce en attente"
          description="Toutes les nouvelles annonces ont été traitées."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
          <table className="w-full text-body-sm">
            <thead>
              <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
                <th className="px-4 py-2.5 text-left">Annonce</th>
                <th className="px-4 py-2.5 text-left">Catégorie</th>
                <th className="px-4 py-2.5 text-left">Prix</th>
                <th className="px-4 py-2.5 text-left">Soumise le</th>
                <th className="px-4 py-2.5 text-right">Décision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l) => (
                <tr
                  key={l.id}
                  data-testid="pending-row"
                  data-listing-id={l.id}
                  className="border-b border-n-100 last:border-0 hover:bg-n-50"
                >
                  <td className="px-4 py-3">
                    <Link href={`/listings/${l.id}`} className="font-medium text-ink hover:text-primary">{l.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-n-700">{l.categoryLabel ?? "—"}</td>
                  <td className="px-4 py-3 tabular text-ink">{eur(l.priceCents)}</td>
                  <td className="px-4 py-3 text-caption text-n-500">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        data-testid="pending-approve"
                        disabled={pendingId !== null}
                        onClick={() => decide(l.id, "ACTIVE")}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        data-testid="pending-reject"
                        disabled={pendingId !== null}
                        onClick={() => decide(l.id, "ARCHIVED")}
                      >
                        Rejeter
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
