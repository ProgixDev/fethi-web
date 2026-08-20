"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { analyticsApi, type CitySummary } from "@/lib/api";
import { formatNumber } from "@/lib/utils/format";

// Villes annoncées sur la feuille de route produit mais sans aucun utilisateur
// encore inscrit — ce n'est pas une donnée (rien à interroger côté DB), juste
// la communication du plan d'expansion. Clairement séparé des villes réelles
// ci-dessus, qui viennent de `profiles.city`/`neighborhood`.
const roadmap = [
  { name: "Hellemmes", note: "Ouverture visée été 2026" },
  { name: "Lomme", note: "Ouverture visée été 2026" },
  { name: "Roubaix", note: "Ouverture visée automne 2026" },
  { name: "Tourcoing", note: "Ouverture visée automne 2026" },
];

export default function SettingsCitiesPage() {
  const [cities, setCities] = React.useState<CitySummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    analyticsApi
      .cities()
      .then((res) => {
        if (alive) setCities(res);
      })
      .catch(() => {
        if (alive) setError("Impossible de charger les villes.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container-admin py-8 space-y-8">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Villes" },
        ]}
        title="Villes"
        description="Lille intra-muros aujourd'hui — l'expansion suit le rythme de la communauté."
      />

      {error ? (
        <div className="rounded-md bg-danger/10 px-3 py-2 text-body-sm text-danger">{error}</div>
      ) : null}

      <section>
        <h2 className="text-h3 font-medium text-ink">Villes actives</h2>
        <p className="mt-1 text-body-sm text-n-500">
          Comptées à partir des inscriptions réelles (ville/quartier renseignés sur le profil).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-body-sm text-n-500">Chargement…</p>
          ) : cities.length === 0 ? (
            <p className="text-body-sm text-n-500">Aucune ville avec des inscriptions pour l&apos;instant.</p>
          ) : (
            cities.map((c) => (
              <div key={c.name} className="rounded-lg border border-n-100 bg-surface p-5">
                <div className="flex items-start justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-n-700">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <Pill tone="success" dot>Active</Pill>
                </div>
                <p className="mt-4 text-h3 font-medium text-ink">{c.name}</p>
                <ul className="mt-4 space-y-1.5 text-body-sm">
                  <li className="flex justify-between">
                    <span className="text-n-500">Quartiers</span>
                    <span className="tabular text-ink">{c.neighborhoods}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-n-500">Utilisateurs</span>
                    <span className="tabular text-ink">{formatNumber(c.users)}</span>
                  </li>
                </ul>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-h3 font-medium text-ink">Feuille de route</h2>
        <p className="mt-1 text-body-sm text-n-500">
          Prochaines villes envisagées — communication produit, pas des inscriptions en cours.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {roadmap.map((c) => (
            <div key={c.name} className="rounded-lg border border-dashed border-n-200 bg-paper p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface text-n-500">
                  <MapPin className="h-4 w-4" />
                </span>
                <Pill tone="neutral">Prévu</Pill>
              </div>
              <p className="mt-4 text-h3 font-medium text-ink">{c.name}</p>
              <p className="mt-0.5 text-body-sm text-n-500">{c.note}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
