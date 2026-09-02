"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  listingsApi,
  type ListingStatus,
  type ModerationListing,
} from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

const statusTone: Record<ListingStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  DRAFT: "info",
  PENDING_REVIEW: "accent",
  PAUSED: "warning",
  SOLD: "neutral",
  ARCHIVED: "danger",
};
const statusLabel: Record<ListingStatus, string> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  PENDING_REVIEW: "En attente de validation",
  PAUSED: "Masqué",
  SOLD: "Vendu",
  ARCHIVED: "Retiré",
};

type QueueFilter = "ALL" | "PENDING_REVIEW" | "DRAFT" | "PAUSED" | "ARCHIVED";

/**
 * Moderation queue (WEB-010, extended by WEB-023). Surfaces listings needing
 * staff attention — awaiting first-publish approval (PENDING_REVIEW),
 * incomplete drafts (DRAFT), soft-hidden (PAUSED) and taken-down (ARCHIVED) —
 * and lets a moderator approve/reject/soft-hide/archive/restore inline. Every
 * action goes through `listingsApi.setStatus` → staff-gated service-role
 * handler + SCR-004 audit. Once WEB-008 `reports` lands, reported listings
 * join this feed and `reportsCount` becomes live.
 */
export default function ListingsModerationPage() {
  const [filter, setFilter] = React.useState<QueueFilter>("ALL");
  const [items, setItems] = React.useState<ModerationListing[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const fetchQueue = React.useCallback(
    (signal?: { aborted: boolean }) => {
      return listingsApi
        .moderationQueue(filter === "ALL" ? {} : { status: filter })
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
    },
    [filter],
  );

  React.useEffect(() => {
    const signal = { aborted: false };
    fetchQueue(signal);
    return () => {
      signal.aborted = true;
    };
  }, [fetchQueue]);

  async function reload() {
    setLoading(true);
    await fetchQueue();
  }

  async function moderate(id: string, next: ListingStatus) {
    setPendingId(id);
    setError(null);
    try {
      await listingsApi.setStatus(id, next);
      await reload();
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Action impossible.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="container-admin py-8 space-y-6" data-testid="moderation-queue">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/listings", label: "Annonces" },
          { label: "Modération" },
        ]}
        title="File de modération"
        description={
          loading
            ? "Chargement…"
            : `${items.length} annonce(s) à traiter. Les signalements rejoindront cette file (WEB-008).`
        }
        actions={
          <Select
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value as QueueFilter)}
            className="w-48"
          >
            <option value="ALL">Toute la file</option>
            <option value="PENDING_REVIEW">En attente de validation</option>
            <option value="DRAFT">Brouillons</option>
            <option value="PAUSED">Masquées</option>
            <option value="ARCHIVED">Retirées</option>
          </Select>
        }
      />

      {error ? (
        <div
          data-testid="moderation-error"
          className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-body text-n-500">Chargement…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="File vide"
          description="Aucune annonce à modérer pour ce filtre."
        />
      ) : (
        <ul className="divide-y divide-n-100 rounded-lg border border-n-100 bg-surface">
          {items.map((l) => (
            <li
              key={l.id}
              data-testid="queue-row"
              data-listing-id={l.id}
              data-listing-status={l.status}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/listings/${l.id}`}
                  className="text-body-sm font-medium text-ink hover:underline truncate block"
                >
                  {l.title}
                </Link>
                <p className="text-caption text-n-500 truncate">
                  {l.owner?.displayName ?? "Voisin·e"} · {l.neighborhood ?? "—"} ·{" "}
                  {formatDate(l.createdAt)}
                  {l.reportsCount > 0 ? ` · ${l.reportsCount} signalement(s)` : ""}
                </p>
              </div>

              <Pill tone={statusTone[l.status]} dot>
                {statusLabel[l.status]}
              </Pill>

              <div className="flex items-center gap-2">
                {l.status === "PENDING_REVIEW" ? (
                  <>
                    <Button
                      size="sm"
                      data-testid="queue-approve"
                      disabled={pendingId !== null}
                      onClick={() => moderate(l.id, "ACTIVE")}
                    >
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      data-testid="queue-reject"
                      disabled={pendingId !== null}
                      onClick={() => moderate(l.id, "ARCHIVED")}
                    >
                      Rejeter
                    </Button>
                  </>
                ) : (
                  <>
                    {l.status !== "PAUSED" && l.status !== "ARCHIVED" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="queue-hide"
                        disabled={pendingId !== null}
                        onClick={() => moderate(l.id, "PAUSED")}
                      >
                        Masquer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        data-testid="queue-restore"
                        disabled={pendingId !== null}
                        onClick={() => moderate(l.id, "ACTIVE")}
                      >
                        Restaurer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      data-testid="queue-archive"
                      disabled={pendingId !== null || l.status === "ARCHIVED"}
                      onClick={() => moderate(l.id, "ARCHIVED")}
                    >
                      Retirer
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
