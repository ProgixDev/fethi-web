import { CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { timeAgo } from "@/lib/utils/format";

export const metadata = { title: "Stripe sync" };

// Aucun endpoint admin n'expose l'etat live des webhooks Stripe Connect —
// exemples illustratifs uniquement.
const exampleEvents = [
  { event: "payment_intent.succeeded", at: "2026-05-04T13:42:00Z", status: "ok" as const },
  { event: "transfer.created", at: "2026-05-04T13:43:00Z", status: "ok" as const },
];

export default function StripeSyncPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/finance", label: "Finance" },
          { label: "Stripe sync" },
        ]}
        title="Stripe sync"
        description="Aucune supervision de la synchronisation Stripe connectée pour l'instant."
        actions={
          <Button variant="outline" size="sm" disabled title="Re-synchronisation pas encore connectée à un backend">
            <RefreshCw className="h-3.5 w-3.5" />
            Re-synchroniser maintenant
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          L&apos;admin n&apos;expose pas encore l&apos;état live des webhooks Stripe Connect (la
          fonction <code>stripe-webhook</code> les traite côté serveur). Les cartes et évènements
          ci-dessous sont des exemples illustratifs, pas des données réelles.
        </p>
      </NotConnectedNotice>

      <div className="grid gap-3 md:grid-cols-3">
        <Status label="Webhooks" value="—" hint="Statut non disponible" />
        <Status label="Compte Connect" value="—" hint="Statut non disponible" />
        <Status label="Mode" value="—" hint="Statut non disponible" />
      </div>

      <Card>
        <CardBody>
          <h3 className="text-h3 font-medium text-ink">Évènements récents (exemples)</h3>
          <ul className="mt-3 divide-y divide-n-100">
            {exampleEvents.map((w, i) => (
              <li key={i} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  {w.status === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-warning" />
                  )}
                  <span className="font-mono text-body-sm text-ink">{w.event}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-caption text-n-500">{timeAgo(w.at)}</span>
                  <Pill tone={w.status === "ok" ? "success" : "warning"}>
                    {w.status === "ok" ? "200" : "warn"}
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function Status({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-n-100 bg-surface p-4">
      <p className="text-label text-n-500">{label}</p>
      <p className="mt-1 text-h3 font-medium text-ink">{value}</p>
      <div className="mt-2 flex items-center justify-between">
        <Pill tone="neutral">Inconnu</Pill>
        <span className="text-caption text-n-500">{hint}</span>
      </div>
    </div>
  );
}
