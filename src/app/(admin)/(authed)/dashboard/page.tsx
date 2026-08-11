"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ShoppingBag,
  Users as UsersIcon,
  Tag,
  ShieldAlert,
  Banknote,
  IdCard,
  Scale,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { KPIStat } from "@/components/ui/KPIStat";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Sparkline } from "@/components/admin/charts/Chart";
import { DashboardGmvChart } from "@/components/admin/charts/DashboardGmvChart";
// Activity feed has no backend read model yet (no /admin/activity aggregation
// exists — WEB-014 covers users/listings/marketplace/engagement/geo/reports,
// not a cross-entity activity stream). Sanctioned fallback per WEB-020: keep
// the fixture but clearly label it as sample data (see the "Exemple" pill
// below) so it can't be mistaken for a live feed.
import { activity } from "@/lib/fixtures/activity";
import {
  analyticsApi,
  financeApi,
  listingsApi,
  reportsApi,
  type UsersSummary,
  type FinanceSummary,
  type Listing,
  type MarketplaceSummary,
  type TrendPoint,
} from "@/lib/api";
import { formatEuro, formatNumber, timeAgo, formatDate } from "@/lib/utils/format";
import { colors } from "@/lib/tokens";

// Mini hook : agrege les 4 ressources dont on a besoin pour les KPIs +
// queue + top listings. On les lance en parallele pour ne pas faire 4
// requetes en cascade.
function useDashboardData() {
  const [users, setUsers] = React.useState<UsersSummary | null>(null);
  const [finance, setFinance] = React.useState<FinanceSummary | null>(null);
  const [topListings, setTopListings] = React.useState<Listing[]>([]);
  const [activeListingsCount, setActiveListingsCount] = React.useState<number>(0);
  const [openReports, setOpenReports] = React.useState<number>(0);
  const [pendingKyc, setPendingKyc] = React.useState<number>(0);
  const [marketplace, setMarketplace] = React.useState<MarketplaceSummary | null>(null);
  const [signupsTrend, setSignupsTrend] = React.useState<TrendPoint[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    Promise.allSettled([
      analyticsApi.summary(),
      financeApi.summary(),
      listingsApi.list({ status: "ACTIVE", size: 5, sort: "viewCount,desc" }),
      reportsApi.list({ status: "OPEN", size: 1 }),
      analyticsApi.marketplace(),
      analyticsApi.signupsTrend(),
    ])
      .then(([uRes, fRes, lRes, rRes, mRes, sRes]) => {
        if (!alive) return;
        if (uRes.status === "fulfilled") {
          setUsers(uRes.value);
          setPendingKyc(uRes.value.kycPending);
        }
        if (fRes.status === "fulfilled") setFinance(fRes.value);
        if (lRes.status === "fulfilled") {
          setTopListings(lRes.value.content);
          // totalElements vient de Spring Data Page<>
          const total = (lRes.value as { totalElements?: number }).totalElements;
          setActiveListingsCount(total ?? lRes.value.content.length);
        }
        if (rRes.status === "fulfilled") {
          const total = (rRes.value as { totalElements?: number }).totalElements;
          setOpenReports(total ?? rRes.value.content.length);
        }
        if (mRes.status === "fulfilled") setMarketplace(mRes.value);
        if (sRes.status === "fulfilled") setSignupsTrend(sRes.value);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return {
    users,
    finance,
    topListings,
    activeListingsCount,
    openReports,
    pendingKyc,
    marketplace,
    signupsTrend,
    loading,
  };
}

const activityIcon: Record<string, React.ReactNode> = {
  listing_sold: <ShoppingBag className="h-3.5 w-3.5" />,
  user_signup: <UsersIcon className="h-3.5 w-3.5" />,
  report_filed: <ShieldAlert className="h-3.5 w-3.5" />,
  kyc_verified: <IdCard className="h-3.5 w-3.5" />,
  kyc_submitted: <IdCard className="h-3.5 w-3.5" />,
  listing_published: <Tag className="h-3.5 w-3.5" />,
  listing_rejected: <Tag className="h-3.5 w-3.5" />,
  payout_completed: <Banknote className="h-3.5 w-3.5" />,
  user_suspended: <ShieldAlert className="h-3.5 w-3.5" />,
  dispute_opened: <Scale className="h-3.5 w-3.5" />,
};

const activityLabel: Record<string, string> = {
  listing_sold: "Vente",
  user_signup: "Nouveau compte",
  report_filed: "Signalement",
  kyc_verified: "KYC validé",
  kyc_submitted: "KYC soumis",
  listing_published: "Annonce publiée",
  listing_rejected: "Annonce rejetée",
  payout_completed: "Virement effectué",
  user_suspended: "Compte suspendu",
  dispute_opened: "Litige ouvert",
};

export default function AdminDashboardPage() {
  const {
    users,
    finance,
    topListings,
    activeListingsCount,
    openReports,
    pendingKyc,
    marketplace,
    signupsTrend,
    loading,
  } = useDashboardData();

  // Cents -> euros for the sparkline/chart; Sparkline's default dataKey reads
  // "value", so gmv is remapped, while signups (already a headcount) is read
  // straight off `count` via the `dataKey` prop.
  const gmvSparkData = (marketplace?.gmvTrend ?? [])
    .slice(-14)
    .map((p) => ({ date: p.date, value: p.count / 100 }));
  const signupsSparkData = signupsTrend.slice(-14);

  const queue = [
    {
      label: "Modération",
      value: openReports,
      href: "/moderation",
      tone: "warning" as const,
      hint: "À traiter",
    },
    {
      label: "Litiges",
      value: finance?.refundedOrders ?? 0,
      href: "/disputes",
      tone: "danger" as const,
      hint: "Ouvert",
    },
    {
      label: "KYC en attente",
      value: pendingKyc,
      href: "/kyc",
      tone: "info" as const,
      hint: "Demandes",
    },
    {
      label: "Versements",
      value: formatEuro((finance?.totalFeesCents ?? 0) / 100),
      href: "/finance/payouts",
      tone: "primary" as const,
      hint: "Commissions",
    },
  ];

  return (
    <div className="container-admin py-8 space-y-8">
      <PageHeader
        title="Tableau de bord"
        description={`Aperçu de l'activité au ${formatDate(new Date(), "d MMMM yyyy")} — Lille intra-muros.`}
        actions={
          <>
            <Button href="/communications/announcements" variant="outline" size="sm">
              Annonce
            </Button>
            <Button href="/activity" size="sm">
              Voir toute l&apos;activité
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      />

      {/* KPIs — viennent des endpoints backend */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPIStat
          label="Utilisateurs"
          value={users ? formatNumber(users.total) : loading ? "…" : "—"}
          hint={users ? `Vérifiés KYC : ${formatNumber(users.kycVerified)}` : undefined}
          trend={<Sparkline data={signupsSparkData} dataKey="count" color={colors.primary} />}
        />
        <KPIStat
          label="GMV — commandes payées"
          value={finance ? formatEuro(finance.totalGmvCents / 100) : loading ? "…" : "—"}
          hint={finance ? `${finance.completedOrders} ${finance.completedOrders > 1 ? "ventes" : "vente"} finalisée${finance.completedOrders > 1 ? "s" : ""}` : undefined}
          trend={<Sparkline data={gmvSparkData} color={colors.accent} />}
        />
        <KPIStat
          label="Annonces actives"
          value={loading ? "…" : formatNumber(activeListingsCount)}
          hint={topListings.length > 0 ? `Plus vue : ${topListings[0].viewCount ?? 0}` : undefined}
        />
        <KPIStat
          label="Revenu — commissions"
          value={finance ? formatEuro(finance.totalFeesCents / 100) : loading ? "…" : "—"}
          hint="Commission 5 %"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* GMV + signups chart — real data via analyticsApi.marketplace()/signupsTrend() (WEB-014) */}
        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <header className="flex items-end justify-between gap-4 pb-4">
            <div>
              <p className="text-label uppercase tracking-wide text-n-500">
                Volume de transactions — 30 jours
              </p>
              <p className="mt-1 text-h2 font-medium tabular tracking-tight text-ink">
                {finance ? formatEuro(finance.totalGmvCents / 100) : "—"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-caption text-n-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" /> GMV (€)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent" /> Inscriptions
              </span>
            </div>
          </header>
          <DashboardGmvChart
            gmvTrend={marketplace?.gmvTrend ?? []}
            signupsTrend={signupsTrend}
          />
        </section>

        {/* File d'attente */}
        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <header className="pb-4">
            <p className="text-label uppercase tracking-wide text-n-500">
              File d&apos;attente
            </p>
            <p className="mt-1 text-body-sm text-n-500">
              Tâches qui requièrent une décision humaine.
            </p>
          </header>
          <ul className="divide-y divide-n-100">
            {queue.map((q) => (
              <li key={q.label}>
                <Link
                  href={q.href}
                  className="flex items-center justify-between gap-3 py-3 group"
                >
                  <div className="flex items-center gap-3">
                    <Pill tone={q.tone} dot>
                      {q.hint}
                    </Pill>
                    <span className="text-body text-ink">{q.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-h3 font-medium tabular text-ink">{q.value}</span>
                    <ArrowUpRight className="h-4 w-4 text-n-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Activity — no /admin/activity read model yet (see import comment
            above); rendered from the fixture and explicitly labeled "Exemple"
            per WEB-020's sanctioned fallback, so it reads as sample data. */}
        <section className="rounded-lg border border-n-100 bg-surface">
          <header className="flex items-center justify-between border-b border-n-100 px-5 py-4">
            <div>
              <p className="flex items-center gap-2 text-h3 font-medium text-ink">
                Activité récente
                <Pill tone="neutral">Exemple</Pill>
              </p>
              <p className="text-body-sm text-n-500">
                Données d&apos;exemple — en attente d&apos;un flux d&apos;activité réel côté backend.
              </p>
            </div>
            <Link
              href="/activity"
              className="text-body-sm font-medium text-primary hover:text-primary-hover"
            >
              Tout voir →
            </Link>
          </header>
          <ul className="divide-y divide-n-100">
            {activity.slice(0, 7).map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-n-100 text-n-600">
                  {activityIcon[e.type] ?? <Tag className="h-3.5 w-3.5" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-ink">
                    <span className="font-medium">{e.actor}</span>
                    <span className="text-n-500"> · {activityLabel[e.type]}</span>
                    {e.target ? (
                      <>
                        {" "}— <span className="text-n-700">{e.target}</span>
                      </>
                    ) : null}
                    {typeof e.amount === "number" ? (
                      <>
                        {" "}<span className="text-n-700">· {formatEuro(e.amount)}</span>
                      </>
                    ) : null}
                  </p>
                  <p className="text-caption text-n-400">{timeAgo(e.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Top listings — REAL backend data */}
        <section className="rounded-lg border border-n-100 bg-surface">
          <header className="flex items-center justify-between border-b border-n-100 px-5 py-4">
            <div>
              <p className="text-h3 font-medium text-ink">Annonces les plus vues</p>
              <p className="text-body-sm text-n-500">Top 5 actives</p>
            </div>
            <Link
              href="/listings"
              className="text-body-sm font-medium text-primary hover:text-primary-hover"
            >
              Tout voir →
            </Link>
          </header>
          <ul className="divide-y divide-n-100">
            {topListings.length === 0 && !loading ? (
              <li className="px-5 py-6 text-body-sm text-n-500">Aucune annonce active.</li>
            ) : null}
            {topListings.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/listings/${l.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-n-50"
                >
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-n-100">
                    {l.photos?.[0] ? (
                      <Image
                        src={l.photos[0]}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm font-medium text-ink truncate">{l.title}</p>
                    <p className="text-caption text-n-500">
                      {l.owner?.displayName ?? "Voisin·e"} · {l.neighborhood ?? "—"}
                    </p>
                  </div>
                  <span className="text-caption tabular text-n-500">
                    {l.viewCount ?? 0} vues
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
