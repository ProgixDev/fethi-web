"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DataTable } from "@/components/admin/tables/DataTable";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardBody } from "@/components/ui/Card";
import { ordersApi, type AdminOrder, type OrderStatus } from "@/lib/api";
import { formatEuro, formatDate } from "@/lib/utils/format";

const tone: Record<OrderStatus, React.ComponentProps<typeof Pill>["tone"]> = {
  COMPLETED: "success",
  AWAITING_PICKUP: "warning",
  HANDOFF_PENDING: "info",
  DISPUTED: "danger",
  REFUNDED: "danger",
  CANCELLED: "neutral",
};

const label: Record<OrderStatus, string> = {
  COMPLETED: "Finalisée",
  AWAITING_PICKUP: "En attente de remise",
  HANDOFF_PENDING: "Remise en cours",
  DISPUTED: "Litige",
  REFUNDED: "Remboursée",
  CANCELLED: "Annulée",
};

export default function OrdersPage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<OrderStatus | "all">("all");
  const [orders, setOrders] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    ordersApi
      .list({
        status: statusFilter === "all" ? undefined : statusFilter,
        size: 100,
      })
      .then((res) => {
        if (alive) setOrders(res.content);
      })
      .catch((err) => {
        if (alive) setError(err?.message ?? "Chargement impossible");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [statusFilter]);

  const columns = React.useMemo<ColumnDef<AdminOrder>[]>(
    () => [
      {
        id: "ref",
        header: "Référence",
        accessorKey: "id",
        cell: ({ row }) => (
          <span className="font-medium text-ink tabular">
            #{row.original.id.slice(0, 8)}
          </span>
        ),
      },
      {
        id: "listing",
        header: "Annonce",
        cell: ({ row }) => (
          <span className="text-body-sm text-n-700 truncate">
            {row.original.listingTitleSnapshot ?? <span className="text-n-400">—</span>}
          </span>
        ),
      },
      {
        id: "amount",
        header: "Montant",
        cell: ({ row }) => (
          <span className="text-body-sm tabular text-ink">
            {formatEuro(row.original.amountCents / 100)}
          </span>
        ),
      },
      {
        id: "fee",
        header: "Commission",
        cell: ({ row }) => (
          <span className="text-caption tabular text-n-500">
            {formatEuro(row.original.feeCents / 100)}
          </span>
        ),
      },
      {
        id: "payment",
        header: "Paiement",
        cell: ({ row }) => (
          <span className="text-caption text-n-500">
            {row.original.paymentStatus ?? <span className="text-n-400">—</span>}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Créée le",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-caption text-n-500">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        accessorKey: "status",
        cell: ({ row }) => (
          <Pill tone={tone[row.original.status]} dot>
            {label[row.original.status]}
          </Pill>
        ),
      },
    ],
    [],
  );

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Commandes" }]}
        title="Commandes"
        description={`${orders.length} ${orders.length > 1 ? "commandes" : "commande"} affichées.`}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Référence, annonce…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-80"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.currentTarget.value as OrderStatus | "all")}
          className="w-56"
        >
          <option value="all">Tous statuts</option>
          {(Object.keys(label) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>
              {label[s]}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <Card>
          <CardBody>
            <p className="text-body-sm text-danger">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      <DataTable
        columns={columns}
        data={orders}
        globalFilter={query}
        getRowId={(r) => r.id}
        onRowClick={(r) => router.push(`/orders/${r.id}`)}
        empty={loading ? "Chargement…" : "Aucune commande pour ces filtres."}
      />
    </div>
  );
}
