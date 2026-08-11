import { Copy, Plus } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Clés API" };

const keys = [
  {
    name: "Production",
    masked: "mst_live_••••f9a2",
    scope: "read-write",
    lastUsed: "2026-05-04T13:42:00Z",
    createdAt: "2025-10-12T08:00:00Z",
    tone: "danger" as const,
  },
  {
    name: "Staging",
    masked: "mst_test_••••a17b",
    scope: "read-write",
    lastUsed: "2026-05-04T11:00:00Z",
    createdAt: "2025-10-12T08:00:00Z",
    tone: "info" as const,
  },
  {
    name: "Mobile App",
    masked: "mst_live_••••c4e0",
    scope: "read-only",
    lastUsed: "2026-05-04T13:55:00Z",
    createdAt: "2026-04-29T14:00:00Z",
    tone: "neutral" as const,
  },
];

export default function SettingsApiKeysPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Clés API" },
        ]}
        title="Clés API"
        description="Authentification serveur-à-serveur pour les intégrations internes."
        actions={
          <Button variant="primary" disabled title="Gestion des clés pas encore connectée à un backend">
            <Plus className="h-3.5 w-3.5" /> Générer une clé
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend de gestion de secrets.</p>
        <p className="mt-0.5 text-n-600">
          Les clés ci-dessous sont un exemple de mise en page — générer, copier ou révoquer
          une clé nécessite une infrastructure de gestion de secrets qui n&apos;existe pas
          encore. Les actions sont désactivées en attendant.
        </p>
      </NotConnectedNotice>

      <section className="rounded-lg border border-n-100 bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-paper text-left">
              <tr>
                <th className="px-5 py-3 text-label font-medium text-n-500">Nom</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Clé</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Scope</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Créée</th>
                <th className="px-5 py-3 text-label font-medium text-n-500">Dernier usage</th>
                <th className="px-5 py-3 text-label font-medium text-n-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-n-100">
              {keys.map((k) => (
                <tr key={k.name} className="hover:bg-n-50">
                  <td className="px-5 py-3">
                    <p className="text-ink">{k.name}</p>
                    <Pill tone={k.tone}>
                      {k.name === "Production" ? "Live" : k.name === "Staging" ? "Test" : "Read-only"}
                    </Pill>
                  </td>
                  <td className="px-5 py-3">
                    <code className="rounded bg-paper px-2 py-1 text-caption text-ink">{k.masked}</code>
                  </td>
                  <td className="px-5 py-3 text-n-700">{k.scope}</td>
                  <td className="px-5 py-3 text-n-500">{formatDate(k.createdAt)}</td>
                  <td className="px-5 py-3 text-n-500">{formatDate(k.lastUsed)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" disabled><Copy className="h-3.5 w-3.5" /> Copier</Button>
                    <Button variant="outline" size="sm" className="ml-2" disabled>Révoquer</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
