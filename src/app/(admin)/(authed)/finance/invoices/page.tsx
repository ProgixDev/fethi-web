import { Download, FileText } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";
import { formatEuro } from "@/lib/utils/format";

export const metadata = { title: "Factures" };

// Aucune table `invoices` cote backend — exemples illustratifs uniquement.
const exampleInvoices = [
  { id: "INV-2026-04-001", customer: "MyStreet — Frais marketplace", period: "Avril 2026", total: 1687.2, vat: 337.44, status: "paid" as const },
  { id: "INV-2026-05-001", customer: "MyStreet — Frais marketplace (en cours)", period: "Mai 2026", total: 320.2, vat: 64.04, status: "draft" as const },
];

export default function InvoicesPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/finance", label: "Finance" },
          { label: "Factures" },
        ]}
        title="Factures"
        description="Aucune génération de facture connectée pour l'instant."
        actions={
          <Button variant="outline" size="sm" disabled title="Facturation pas encore connectée à un backend">
            <Download className="h-3.5 w-3.5" />
            Tout télécharger
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas de table <code>invoices</code>. Les factures ci-dessous sont des
          exemples illustratifs, pas des données réelles — le téléchargement n&apos;est pas
          disponible.
        </p>
      </NotConnectedNotice>

      <div className="overflow-hidden rounded-lg border border-n-100 bg-surface">
        <table className="w-full text-body-sm">
          <thead>
            <tr className="border-b border-n-100 bg-paper text-label uppercase tracking-wide text-n-500">
              <th className="px-4 py-2.5 text-left">N°</th>
              <th className="px-4 py-2.5 text-left">Émis pour</th>
              <th className="px-4 py-2.5 text-left">Période</th>
              <th className="px-4 py-2.5 text-right">HT</th>
              <th className="px-4 py-2.5 text-right">TVA</th>
              <th className="px-4 py-2.5 text-right">TTC</th>
              <th className="px-4 py-2.5 text-left">Statut</th>
              <th className="px-4 py-2.5 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {exampleInvoices.map((inv) => (
              <tr key={inv.id} className="border-b border-n-100 last:border-0 hover:bg-n-50">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 font-medium text-ink">
                    <FileText className="h-3.5 w-3.5 text-n-400" />
                    <span className="tabular">{inv.id}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-n-700">{inv.customer}</td>
                <td className="px-4 py-3 text-n-700">{inv.period}</td>
                <td className="px-4 py-3 text-right tabular text-ink">{formatEuro(inv.total - inv.vat)}</td>
                <td className="px-4 py-3 text-right tabular text-n-500">{formatEuro(inv.vat)}</td>
                <td className="px-4 py-3 text-right tabular text-ink font-medium">{formatEuro(inv.total)}</td>
                <td className="px-4 py-3">
                  <Pill tone={inv.status === "paid" ? "success" : "warning"} dot>
                    {inv.status === "paid" ? "Payée" : "Brouillon"}
                  </Pill>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" disabled>
                    PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
