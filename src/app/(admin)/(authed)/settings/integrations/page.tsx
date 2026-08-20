import { Plug } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";

export const metadata = { title: "Intégrations" };

// Aucun registre d'integrations cote backend — statuts non verifiables depuis
// l'admin (les cles vivent dans les secrets d'environnement / Edge Functions).
const integrations = [
  { name: "Stripe", desc: "Paiements & versements (Stripe Connect)" },
  { name: "Sumsub", desc: "Vérification d'identité (KYC)" },
  { name: "RevenueCat", desc: "Achats intégrés (MyStreet+, boosts)" },
  { name: "SendGrid / Brevo", desc: "E-mails transactionnels" },
  { name: "Cloudinary", desc: "Stockage & transformation images" },
];

export default function SettingsIntegrationsPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Intégrations" },
        ]}
        title="Intégrations"
        description="Aucune supervision des intégrations connectée pour l'instant."
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          L&apos;admin n&apos;a pas de registre d&apos;intégrations ni de moyen de vérifier leur
          statut de connexion — les identifiants vivent dans les secrets d&apos;environnement /
          Edge Functions. La liste ci-dessous rappelle les services utilisés par MyStreet, sans
          statut en direct.
        </p>
      </NotConnectedNotice>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <div key={i.name} className="rounded-lg border border-n-100 bg-surface p-5">
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-n-700">
                <Plug className="h-4 w-4" />
              </span>
              <Pill tone="neutral">Statut inconnu</Pill>
            </div>
            <p className="mt-4 text-h3 font-medium text-ink">{i.name}</p>
            <p className="mt-0.5 text-body-sm text-n-500">{i.desc}</p>
            <div className="mt-5">
              <Button variant="outline" size="sm" disabled title="Pas encore connecté à un backend">
                Gérer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
