"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Plus, Search, Star } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DataTable } from "@/components/admin/tables/DataTable";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { formatEuro, formatDate, initials } from "@/lib/utils/format";
import {
  usersApi,
  AdminUserListItem,
  UserMeta,
} from "@/lib/api";
import { InviteAdminDialog } from "@/components/admin/users/InviteAdminDialog";

// ---------------------------------------------------------------------------
// Maps enums backend (UPPERCASE) → UI
// ---------------------------------------------------------------------------

type UserStatus = AdminUserListItem["status"];
type KycStatus = AdminUserListItem["kyc"];

const statusTone: Record<UserStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  ACTIVE: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  BANNED: "danger",
};

const statusLabel: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  PENDING: "En attente",
  SUSPENDED: "Suspendu",
  BANNED: "Banni",
};

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

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UsersListPage() {
  const router = useRouter();

  // -- filtres ---------------------------------------------------------------
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [kyc, setKyc] = React.useState<string>("all");
  const [neighborhood, setNeighborhood] = React.useState<string>("all");
  const [page, setPage] = React.useState(0);

  // -- données ---------------------------------------------------------------
  const [meta, setMeta] = React.useState<UserMeta | null>(null);
  const [rows, setRows] = React.useState<AdminUserListItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  // -- debounce recherche ---------------------------------------------------
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // -- meta (une fois) ------------------------------------------------------
  React.useEffect(() => {
    usersApi
      .meta()
      .then(setMeta)
      .catch((err) => {
        console.error("meta load failed", err);
      });
  }, []);

  // -- chargement liste (sur changement de filtre ou page) ------------------
  const buildFilters = React.useCallback(
    () => ({
      q: debouncedQuery || undefined,
      status: status === "all" ? undefined : status,
      kyc: kyc === "all" ? undefined : kyc,
      neighborhood: neighborhood === "all" ? undefined : neighborhood,
      page,
      size: PAGE_SIZE,
      sort: "createdAt,desc",
    }),
    [debouncedQuery, status, kyc, neighborhood, page],
  );

  const loadUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await usersApi.list(buildFilters());
      setRows(res.content);
      setTotal(res.totalElements);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setLoading(false);
    }
  }, [buildFilters]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // -- reset page quand filtre change --------------------------------------
  React.useEffect(() => {
    setPage(0);
  }, [status, kyc, neighborhood]);

  // -- export ---------------------------------------------------------------
  async function handleExport() {
    setExporting(true);
    try {
      await usersApi.exportXlsx({
        q: debouncedQuery || undefined,
        status: status === "all" ? undefined : status,
        kyc: kyc === "all" ? undefined : kyc,
        neighborhood: neighborhood === "all" ? undefined : neighborhood,
      });
    } catch (err) {
      console.error("export failed", err);
      setError("Export Excel impossible.");
    } finally {
      setExporting(false);
    }
  }

  // -- colonnes -------------------------------------------------------------
  const columns = React.useMemo<ColumnDef<AdminUserListItem>[]>(
    () => [
      {
        id: "name",
        header: "Utilisateur",
        size: 280,
        accessorKey: "name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar
              initials={initials(row.original.name || row.original.email)}
              seed={row.original.id}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-ink truncate">
                {row.original.name || "—"}
              </p>
              <p className="text-caption text-n-500 truncate">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: "neighborhood",
        header: "Quartier",
        accessorKey: "neighborhood",
        cell: ({ row }) => (
          <span className="text-body-sm text-n-700">
            {row.original.neighborhood || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => (
          <Pill tone={statusTone[row.original.status]} dot>
            {statusLabel[row.original.status]}
          </Pill>
        ),
      },
      {
        id: "kyc",
        header: "KYC",
        accessorKey: "kyc",
        cell: ({ row }) => (
          <Pill tone={kycTone[row.original.kyc]}>{kycLabel[row.original.kyc]}</Pill>
        ),
      },
      {
        id: "rating",
        header: "Note",
        accessorKey: "rating",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-body-sm tabular text-n-700">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {(row.original.rating ?? 0).toFixed(1).replace(".", ",")}
            <span className="text-n-400">({row.original.reviewsCount ?? 0})</span>
          </span>
        ),
      },
      {
        id: "listings",
        header: "Annonces",
        accessorKey: "listingsCount",
        cell: ({ row }) => (
          <span className="text-body-sm tabular text-n-700">
            {row.original.listingsCount ?? 0}
          </span>
        ),
      },
      {
        id: "gmv",
        header: "GMV",
        accessorKey: "gmvCents",
        cell: ({ row }) => (
          <span className="text-body-sm tabular text-n-700">
            {formatEuro((row.original.gmvCents ?? 0) / 100)}
          </span>
        ),
      },
      {
        id: "joinedAt",
        header: "Inscrit",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-caption text-n-500">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  // -- render ---------------------------------------------------------------
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { label: "Utilisateurs" },
        ]}
        title="Utilisateurs"
        description={
          loading
            ? "Chargement…"
            : `${total} compte${total > 1 ? "s" : ""} au total — Lille intra-muros.`
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting || loading}
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? "Export…" : "Exporter"}
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Inviter un admin
            </Button>
          </>
        }
      />

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher nom, e-mail, handle…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.currentTarget.value)}
          className="w-44"
        >
          <option value="all">Tous les statuts</option>
          {(meta?.statuses ?? Object.keys(statusLabel)).map((s) => (
            <option key={s} value={s}>
              {statusLabel[s as UserStatus] ?? s}
            </option>
          ))}
        </Select>
        <Select
          value={kyc}
          onChange={(e) => setKyc(e.currentTarget.value)}
          className="w-44"
        >
          <option value="all">Tous KYC</option>
          {(meta?.kycStatuses ?? Object.keys(kycLabel)).map((k) => (
            <option key={k} value={k}>
              {kycLabel[k as KycStatus] ?? k}
            </option>
          ))}
        </Select>
        <Select
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.currentTarget.value)}
          className="w-56"
        >
          <option value="all">Tous quartiers</option>
          {(meta?.neighborhoods ?? []).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">
          {error}
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={rows}
        getRowId={(u) => u.id}
        onRowClick={(u) => router.push(`/users/${u.id}`)}
        empty={
          loading
            ? "Chargement des utilisateurs…"
            : "Aucun utilisateur ne correspond à ces filtres."
        }
        // Pagination côté serveur : on désactive la pagination interne en mettant
        // un pageSize >= longueur. Les contrôles sont en dessous.
        pageSize={PAGE_SIZE}
      />

      {/* Pagination serveur */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-md border border-n-100 bg-surface px-4 py-2.5 text-caption text-n-500">
          <span className="tabular">
            Page {page + 1} sur {totalPages} — {total} résultats
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 hover:bg-n-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1 || loading}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 hover:bg-n-100 disabled:opacity-30"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <InviteAdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onCreated={loadUsers}
      />
    </div>
  );
}
