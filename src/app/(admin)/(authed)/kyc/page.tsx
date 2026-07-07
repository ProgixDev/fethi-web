"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { kycApi, type KycListItem, type KycStatus } from "@/lib/api";
import { initials, formatDate } from "@/lib/utils/format";

const kycTone: Record<KycStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  VERIFIED: "success",
  PENDING: "warning",
  REVIEW: "info",
  UNVERIFIED: "neutral",
  REJECTED: "danger",
};

const kycLabel: Record<KycStatus, string> = {
  VERIFIED: "Vérifié",
  PENDING: "En cours",
  REVIEW: "À examiner",
  UNVERIFIED: "Non vérifié",
  REJECTED: "Refusé",
};

const sourceLabel: Record<string, string> = {
  connect: "Stripe Connect",
  profile: "Profil",
  none: "Aucun",
};

const sourceTone: Record<string, React.ComponentProps<typeof Pill>["tone"]> = {
  connect: "info",
  profile: "neutral",
  none: "neutral",
};

export default function KycQueuePage() {
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<KycStatus | "all">("all");
  const [items, setItems] = React.useState<KycListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadItems = React.useCallback(async () => {
    try {
      setError(null);
      const res = await kycApi.list({
        q: query || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        size: 100,
      });
      setItems(res.content);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, [query, statusFilter]);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    loadItems().then(() => {
      if (!alive) {
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [loadItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const pendingCount = items.filter((u) => u.kyc === "PENDING" || u.kyc === "REVIEW").length;
  const verifiedCount = items.filter((u) => u.kyc === "VERIFIED").length;
  const unverifiedCount = items.filter((u) => u.kyc === "UNVERIFIED").length;

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "KYC" }]}
        title="Vérifications KYC"
        description="Suivi des vérifications d'identité des vendeurs via Stripe Connect."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        }
      />

      {/* Stats overview */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-n-100 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-n-100 p-2">
              <FileCheck className="h-4 w-4 text-n-600" />
            </div>
            <div>
              <p className="text-caption text-n-500">Total</p>
              <p className="text-h3 font-medium text-ink">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-n-100 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-amber-50 p-2">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-caption text-n-500">En attente</p>
              <p className="text-h3 font-medium text-ink">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-n-100 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-green-50 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-caption text-n-500">Vérifiés</p>
              <p className="text-h3 font-medium text-ink">{verifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-n-100 bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-gray-50 p-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-caption text-n-500">Non vérifiés</p>
              <p className="text-h3 font-medium text-ink">{unverifiedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Input
          leadingIcon={<Search className="h-4 w-4" />}
          placeholder="Rechercher par nom ou quartier"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          className="w-80"
        />
        <div className="flex gap-2">
          {(["all", "UNVERIFIED", "PENDING", "REVIEW", "VERIFIED", "REJECTED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "bg-n-100 text-n-700 hover:bg-n-200"
              }`}
            >
              {s === "all" ? "Tous" : kycLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">Utilisateur</th>
              <th className="px-4 py-2.5 text-left">Quartier</th>
              <th className="px-4 py-2.5 text-left">Statut KYC</th>
              <th className="px-4 py-2.5 text-left">Source</th>
              <th className="px-4 py-2.5 text-left">Connect</th>
              <th className="px-4 py-2.5 text-left">Inscrit le</th>
              <th className="px-4 py-2.5 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-n-500">
                  Chargement…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-n-500">
                  {query || statusFilter !== "all"
                    ? "Aucun résultat."
                    : "Aucun dossier KYC."}
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/kyc/${u.id}`}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <Avatar initials={initials(u.name)} seed={u.id} size="sm" />
                      <div>
                        <span className="font-medium text-ink">{u.name}</span>
                        <p className="text-caption text-n-500">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-n-700">{u.neighborhood ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Pill tone={kycTone[u.kyc]}>{kycLabel[u.kyc]}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    <Pill tone={sourceTone[u.source]}>{sourceLabel[u.source]}</Pill>
                  </td>
                  <td className="px-4 py-3">
                    {u.source === "connect" ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            u.payoutsEnabled ? "bg-green-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="text-caption text-n-600">
                          {u.payoutsEnabled ? "Activé" : "Restreint"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-caption text-n-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-caption text-n-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/kyc/${u.id}`}
                      className="text-body-sm text-primary hover:underline"
                    >
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
