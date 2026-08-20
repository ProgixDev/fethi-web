"use client";

import * as React from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DataTable } from "@/components/admin/tables/DataTable";
import { Pill } from "@/components/ui/Pill";
import { ordersApi, type AdminOrder } from "@/lib/api";
import { formatDate } from "@/lib/utils/format";

function formatEur(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR")} €`;
}

export default function DisputesPage() {
  const [items, setItems] = React.useState<AdminOrder[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    ordersApi
      .list({ status: "DISPUTED", size: 100 })
      .then((res) => {
        if (alive) setItems(res.content);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const columns: ColumnDef<AdminOrder>[] = [
    {
      id: "ref",
      header: "Référence",
      accessorKey: "id",
      cell: ({ row }) => (
        <Link href={`/orders/${row.original.id}`} className="font-medium tabular text-ink hover:text-primary">
          #{row.original.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      id: "subject",
      header: "Annonce",
      cell: ({ row }) => (
        <span className="text-body-sm text-n-700 truncate block max-w-[260px]">
          {row.original.listingTitleSnapshot ?? "—"}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Montant",
      cell: ({ row }) => (
        <span className="text-body-sm tabular text-ink">{formatEur(row.original.amountCents)}</span>
      ),
    },
    {
      id: "status",
      header: "Statut",
      cell: () => <Pill tone="danger" dot>Litige</Pill>,
    },
    {
      id: "createdAt",
      header: "Ouvert le",
      cell: ({ row }) => <span className="text-caption text-n-500">{formatDate(row.original.createdAt)}</span>,
    },
  ];

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Litiges" }]}
        title="Litiges"
        description={`${items.length} litige(s) en cours.`}
      />
      <DataTable
        columns={columns}
        data={items}
        getRowId={(r) => r.id}
        empty={loading ? "Chargement…" : "Aucun litige."}
      />
    </div>
  );
}
