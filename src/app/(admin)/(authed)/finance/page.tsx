"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Banknote, FileText, KeyRound, Receipt } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { KPIStat } from "@/components/ui/KPIStat";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { financeApi, type FinanceSummary } from "@/lib/api";
import { formatEuro, formatNumber } from "@/lib/utils/format";

const subModules = [
  { href: "/finance/payouts", label: "Versements", desc: "Cycles vers vendeurs", icon: Banknote },
  { href: "/finance/subscriptions", label: "Abonnements", desc: "Boost & Pro tiers", icon: Receipt },
  { href: "/finance/invoices", label: "Factures", desc: "Émises B2B", icon: FileText },
  { href: "/finance/tax", label: "TVA", desc: "Déclaration trimestre", icon: Receipt },
  { href: "/finance/stripe-sync", label: "Stripe sync", desc: "Webhooks & événements", icon: KeyRound },
];

export default function FinancePage() {
  const [summary, setSummary] = React.useState<FinanceSummary | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    financeApi
      .summary()
      .then((s) => {
        if (alive) setSummary(s);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const placeholder = loading ? "…" : "—";
  return (
    <div className="container-admin py-8 space-y-8">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Finance" }]}
        title="Finance"
        description="Vue d'ensemble du chiffre, des frais, des remboursements et des virements."
        actions={
          <Button href="/finance/invoices" size="sm">
            Exporter le mois
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat
          label="GMV — commandes payées"
          value={summary ? formatEuro(summary.totalGmvCents / 100) : placeholder}
          hint="Volume cumulé des transactions finalisées"
        />
        <KPIStat
          label="Revenu — commissions"
          value={summary ? formatEuro(summary.totalFeesCents / 100) : placeholder}
          hint="Commission plateforme 5 %"
        />
        <KPIStat
          label="Commandes finalisées"
          value={summary ? formatNumber(summary.completedOrders) : placeholder}
          hint={summary ? `${summary.pendingOrders} en cours` : undefined}
        />
        <KPIStat
          label="Remboursements"
          value={summary ? formatNumber(summary.refundedOrders) : placeholder}
          hint="Commandes refundées"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {subModules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group rounded-lg border border-n-100 bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-n-700">
                <m.icon className="h-4 w-4" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-n-300 transition-all group-hover:text-n-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
            <p className="mt-6 text-body font-medium text-ink">{m.label}</p>
            <p className="mt-0.5 text-body-sm text-n-500">{m.desc}</p>
          </Link>
        ))}
      </div>

      <Card>
        <CardBody>
          <h3 className="text-h3 font-medium text-ink">Provisions Stripe</h3>
          <p className="mt-1 text-body-sm text-n-500">
            État du compte Stripe Connect en temps réel.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            <li className="rounded-md border border-n-100 bg-paper p-4">
              <p className="text-label text-n-500">Solde disponible</p>
              <p className="mt-1 text-h2 font-medium tabular text-ink">{formatEuro(28420)}</p>
              <Pill tone="success" dot>Synchronisé</Pill>
            </li>
            <li className="rounded-md border border-n-100 bg-paper p-4">
              <p className="text-label text-n-500">Solde en attente</p>
              <p className="mt-1 text-h2 font-medium tabular text-ink">{formatEuro(14580)}</p>
              <Pill tone="warning" dot>D+2</Pill>
            </li>
            <li className="rounded-md border border-n-100 bg-paper p-4">
              <p className="text-label text-n-500">Disputes Stripe</p>
              <p className="mt-1 text-h2 font-medium tabular text-ink">0</p>
              <Pill tone="success" dot>RAS</Pill>
            </li>
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-h3 font-medium text-ink">Rapport rapide</h3>
          <ul className="mt-3 space-y-2 text-body-sm">
            <li className="flex justify-between"><span className="text-n-500">Utilisateurs payants ce mois</span><span className="tabular text-ink">168</span></li>
            <li className="flex justify-between"><span className="text-n-500">Commission effective</span><span className="tabular text-ink">5,0 %</span></li>
            <li className="flex justify-between"><span className="text-n-500">Remboursements</span><span className="tabular text-ink">{formatNumber(8)} (0,4 % GMV)</span></li>
            <li className="flex justify-between"><span className="text-n-500">Coût Stripe (estimé)</span><span className="tabular text-ink">{formatEuro(642)}</span></li>
            <li className="flex justify-between"><span className="text-n-500">Marge brute après Stripe</span><span className="tabular text-success">{formatEuro(1045)}</span></li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
