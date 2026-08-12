import { Plus, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { formatDateTime } from "@/lib/utils/format";

export const metadata = { title: "Webhooks" };

const endpoints = [
  {
    id: "wh_001",
    url: "https://hooks.mystreet.fr/stripe",
    events: ["payment_intent.succeeded", "payout.paid", "charge.refunded"],
    lastStatus: "success" as const,
    retries: 0,
  },
  {
    id: "wh_002",
    url: "https://hooks.mystreet.fr/sumsub",
    events: ["applicant.reviewed", "applicant.rejected"],
    lastStatus: "success" as const,
    retries: 0,
  },
  {
    id: "wh_003",
    url: "https://hooks.mystreet.fr/sendgrid",
    events: ["email.bounced", "email.delivered"],
    lastStatus: "fail" as const,
    retries: 2,
  },
  {
    id: "wh_004",
    url: "https://internal.mystreet.fr/audit",
    events: ["admin.action"],
    lastStatus: "success" as const,
    retries: 0,
  },
];

const deliveries = [
  { at: "2026-05-04T13:42:00Z", endpoint: "/stripe", event: "payment_intent.succeeded", status: 200, ms: 142 },
  { at: "2026-05-04T13:14:00Z", endpoint: "/sumsub", event: "applicant.reviewed", status: 200, ms: 218 },
  { at: "2026-05-04T12:08:00Z", endpoint: "/sendgrid", event: "email.bounced", status: 502, ms: 14821 },
  { at: "2026-05-04T11:55:00Z", endpoint: "/sendgrid", event: "email.bounced", status: 502, ms: 11042 },
  { at: "2026-05-04T11:00:00Z", endpoint: "/audit", event: "admin.action", status: 200, ms: 88 },
  { at: "2026-05-04T10:30:00Z", endpoint: "/stripe", event: "payout.paid", status: 200, ms: 121 },
];

export default function SettingsWebhooksPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Webhooks" },
        ]}
        title="Webhooks"
        description="Endpoints écoutant les évènements marketplace."
        actions={
          <Button variant="primary" disabled title="Gestion des webhooks pas encore connectée à un backend">
            <Plus className="h-3.5 w-3.5" /> Ajouter un endpoint
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Les endpoints et livraisons ci-dessous sont des exemples illustratifs, pas des
          données en direct. Ajouter, rejouer ou modifier un endpoint n&apos;est pas encore
          possible depuis l&apos;admin.
        </p>
      </NotConnectedNotice>

      <section className="rounded-lg border border-n-100 bg-surface">
        <header className="border-b border-n-100 px-5 py-4">
          <p className="text-h3 font-medium text-ink">Endpoints configurés</p>
        </header>
        <ul className="divide-y divide-n-100">
          {endpoints.map((e) => (
            <li key={e.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-body-sm text-ink truncate">{e.url}</p>
                  <p className="mt-1 text-caption text-n-500">
                    {e.events.length} évènements : {e.events.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {e.lastStatus === "success" ? (
                    <Pill tone="success" dot>Succès</Pill>
                  ) : (
                    <Pill tone="danger" dot>Échec</Pill>
                  )}
                  {e.retries > 0 ? <Pill tone="warning">{e.retries} retries</Pill> : null}
                  <Button variant="ghost" size="sm" disabled><RefreshCcw className="h-3.5 w-3.5" /> Rejouer</Button>
                  <Button variant="outline" size="sm" disabled>Modifier</Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-n-100 bg-surface">
        <header className="border-b border-n-100 px-5 py-4">
          <p className="text-h3 font-medium text-ink">Livraisons récentes</p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-paper text-left">
              <tr>
                <th className="px-5 py-3 text-label font-medium text-n-500">Quand</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Endpoint</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Évènement</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Statut HTTP</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Latence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n-100">
              {deliveries.map((d, i) => (
                <tr key={i} className="hover:bg-n-50">
                  <td className="px-5 py-3 text-n-500">{formatDateTime(d.at)}</td>
                  <td className="px-5 py-3 font-mono text-caption text-ink">{d.endpoint}</td>
                  <td className="px-5 py-3 font-mono text-caption text-n-700">{d.event}</td>
                  <td className="px-5 py-3">
                    {d.status >= 500 ? (
                      <Pill tone="danger">{d.status}</Pill>
                    ) : d.status >= 400 ? (
                      <Pill tone="warning">{d.status}</Pill>
                    ) : (
                      <Pill tone="success">{d.status}</Pill>
                    )}
                  </td>
                  <td className="px-5 py-3 tabular text-n-700">{d.ms} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
