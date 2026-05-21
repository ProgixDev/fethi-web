"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { KPIStat } from "@/components/ui/KPIStat";
import { LineChart, BarChart } from "@/components/admin/charts/Chart";
import { formatNumber, formatEuro } from "@/lib/utils/format";
import { colors } from "@/lib/tokens";
import {
  analyticsApi,
  UsersSummary,
  DistItem,
  TrendPoint,
} from "@/lib/api";

// Mappings UPPERCASE enums → FR
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Actifs",
  PENDING: "En attente",
  SUSPENDED: "Suspendus",
  BANNED: "Bannis",
};
const KYC_LABEL: Record<string, string> = {
  VERIFIED: "Vérifié",
  PENDING: "En cours",
  REVIEW: "À examiner",
  UNVERIFIED: "Non vérifié",
  REJECTED: "Refusé",
};

export default function AnalyticsUsersPage() {
  const [summary, setSummary] = React.useState<UsersSummary | null>(null);
  const [byStatus, setByStatus] = React.useState<DistItem[]>([]);
  const [byKyc, setByKyc] = React.useState<DistItem[]>([]);
  const [byNeighborhood, setByNeighborhood] = React.useState<DistItem[]>([]);
  const [signupsTrend, setSignupsTrend] = React.useState<TrendPoint[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.byStatus(),
      analyticsApi.byKyc(),
      analyticsApi.byNeighborhood(),
      analyticsApi.signupsTrend(),
    ])
      .then(([s, st, k, n, t]) => {
        if (!alive) return;
        setSummary(s);
        setByStatus(st);
        setByKyc(k);
        setByNeighborhood(n);
        setSignupsTrend(t);
      })
      .catch((err) => {
        console.error("analytics load failed", err);
        if (alive) setError("Impossible de charger les analytics.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Données transformées pour les graphes
  const signupsData = signupsTrend.map((p) => ({
    date: p.date.slice(5), // MM-DD
    value: p.count,
  }));

  const statusData = byStatus.map((d) => ({
    name: STATUS_LABEL[d.label] ?? d.label,
    count: d.count,
  }));

  const kycData = byKyc.map((d) => ({
    name: KYC_LABEL[d.label] ?? d.label,
    count: d.count,
  }));

  const neighborhoodData = byNeighborhood
    .slice(0, 12) // top 12 quartiers
    .map((d) => ({ name: d.label, users: d.count }));

  const verifiedRate =
    summary && summary.total > 0
      ? summary.kycVerified / summary.total
      : 0;

  const totalSignups = signupsData.reduce((a, d) => a + d.value, 0);

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/analytics/users", label: "Analytique" },
          { label: "Utilisateurs" },
        ]}
        title="Analytique — utilisateurs"
        description={
          loading
            ? "Chargement…"
            : "Acquisition, KYC et répartition par quartier."
        }
      />

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">
          {error}
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat
          label="Utilisateurs totaux"
          value={summary ? formatNumber(summary.total) : "—"}
          hint="Tous comptes confondus"
        />
        <KPIStat
          label="Inscriptions 30 j"
          value={summary ? formatNumber(summary.signupsLast30Days) : "—"}
          hint="Derniers 30 jours"
        />
        <KPIStat
          label="Taux KYC vérifié"
          value={
            summary
              ? (verifiedRate * 100).toFixed(1).replace(".", ",") + " %"
              : "—"
          }
          hint={summary ? `${formatNumber(summary.kycVerified)} comptes vérifiés` : ""}
        />
        <KPIStat
          label="GMV total"
          value={summary ? formatEuro(summary.totalGmvCents / 100) : "—"}
          hint={
            summary
              ? `Note moyenne ${summary.averageRating.toFixed(1).replace(".", ",")}`
              : ""
          }
        />
      </div>

      {/* Courbe inscriptions */}
      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <header className="pb-4">
          <p className="text-label uppercase tracking-wide text-n-500">
            Inscriptions — 30 jours
          </p>
          <p className="mt-1 text-h2 font-medium tabular tracking-tight text-ink">
            {formatNumber(totalSignups)}
          </p>
        </header>
        {signupsData.length > 0 ? (
          <LineChart
            height={240}
            data={signupsData}
            series={[
              { key: "value", label: "Inscriptions", color: colors.primary },
            ]}
          />
        ) : (
          <p className="py-12 text-center text-body-sm text-n-500">
            {loading ? "Chargement…" : "Aucune donnée."}
          </p>
        )}
      </section>

      {/* Répartition statut + KYC */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <header className="pb-4">
            <p className="text-label uppercase tracking-wide text-n-500">
              Par statut
            </p>
            <p className="mt-1 text-body-sm text-n-500">
              Répartition Actif / En attente / Suspendu / Banni
            </p>
          </header>
          {statusData.length > 0 ? (
            <BarChart
              height={240}
              vertical
              data={statusData}
              xKey="name"
              series={[
                { key: "count", label: "Comptes", color: colors.primary },
              ]}
            />
          ) : (
            <p className="py-12 text-center text-body-sm text-n-500">
              {loading ? "Chargement…" : "Aucune donnée."}
            </p>
          )}
        </section>

        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <header className="pb-4">
            <p className="text-label uppercase tracking-wide text-n-500">
              Par KYC
            </p>
            <p className="mt-1 text-body-sm text-n-500">
              Statut de vérification d&apos;identité
            </p>
          </header>
          {kycData.length > 0 ? (
            <BarChart
              height={240}
              vertical
              data={kycData}
              xKey="name"
              series={[
                { key: "count", label: "Comptes", color: colors.primary },
              ]}
            />
          ) : (
            <p className="py-12 text-center text-body-sm text-n-500">
              {loading ? "Chargement…" : "Aucune donnée."}
            </p>
          )}
        </section>
      </div>

      {/* Par quartier */}
      <section className="rounded-lg border border-n-100 bg-surface p-5">
        <header className="pb-4">
          <p className="text-label uppercase tracking-wide text-n-500">
            Utilisateurs par quartier
          </p>
          <p className="mt-1 text-body-sm text-n-500">
            Top {neighborhoodData.length} — Lille intra-muros
          </p>
        </header>
        {neighborhoodData.length > 0 ? (
          <BarChart
            height={320}
            vertical
            data={neighborhoodData}
            xKey="name"
            series={[
              { key: "users", label: "Utilisateurs", color: colors.primary },
            ]}
          />
        ) : (
          <p className="py-12 text-center text-body-sm text-n-500">
            {loading ? "Chargement…" : "Aucun quartier renseigné."}
          </p>
        )}
      </section>
    </div>
  );
}
