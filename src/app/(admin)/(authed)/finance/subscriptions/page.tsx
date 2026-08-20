"use client";

import * as React from "react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { billingApi, type BillingSummary } from "@/lib/api";
import { formatEuro, timeAgo } from "@/lib/utils/format";

const entitlementLabel: Record<string, string> = {
  plus: "MyStreet+",
  custom_radius: "Rayon personnalisé",
  boost: "Boosts",
};

export default function SubscriptionsPage() {
  const [summary, setSummary] = React.useState<BillingSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    billingApi
      .summary()
      .then((res) => {
        if (alive) setSummary(res);
      })
      .catch(() => {
        if (alive) setError("Impossible de charger les données d'abonnement.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const revenue = summary ? summary.revenueCentsLast30Days / 100 : 0;

  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/finance", label: "Finance" },
          { label: "Abonnements" },
        ]}
        title="Abonnements & Boosts"
        description={
          loading
            ? "Chargement…"
            : `Revenu IAP (30 j) : ${formatEuro(revenue)} · ${summary?.transactionsLast30Days ?? 0} transaction${(summary?.transactionsLast30Days ?? 0) > 1 ? "s" : ""}`
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">MyStreet+ et les boosts sont vendus en achat intégré (RevenueCat).</p>
        <p className="mt-0.5 text-n-600">
          Les chiffres ci-dessous viennent des tables réelles <code>app_entitlements</code> /{" "}
          <code>app_store_transactions</code>, mais le webhook RevenueCat n&apos;est pas encore
          configuré côté production (voir docs/setup/revenuecat-iap.md) — attendez-vous à des
          compteurs à zéro tant que l&apos;offre n&apos;est pas live.
        </p>
      </NotConnectedNotice>

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">{error}</div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        {(summary?.entitlements ?? []).map((e) => (
          <Card key={e.key}>
            <CardBody>
              <div className="flex items-center justify-between">
                <Pill tone="primary">{entitlementLabel[e.key] ?? e.key}</Pill>
                <span className="text-h2 font-medium tabular tracking-tight text-ink">
                  {e.activeCount}
                </span>
              </div>
              <p className="mt-3 text-body-sm text-n-600">Entitlements actifs</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody>
          <h3 className="text-h3 font-medium text-ink">Transactions récentes</h3>
          {loading ? (
            <p className="mt-3 text-body-sm text-n-500">Chargement…</p>
          ) : (summary?.recent.length ?? 0) === 0 ? (
            <p className="mt-3 text-body-sm text-n-500">Aucune transaction IAP pour l&apos;instant.</p>
          ) : (
            <ul className="mt-3 divide-y divide-n-100">
              {summary!.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-body-sm text-ink">
                      {entitlementLabel[t.entitlementKey ?? ""] ?? t.productId ?? "—"}
                      <span className="text-n-500"> — {t.eventType ?? "évènement"} · {t.platform}</span>
                    </p>
                    <p className="text-caption text-n-400">
                      {t.purchasedAt ? timeAgo(t.purchasedAt) : "—"}
                    </p>
                  </div>
                  <span className="text-body-sm tabular text-ink">
                    {t.priceCents != null ? formatEuro(t.priceCents / 100) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
