import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";

export const metadata = { title: "Support" };

// Aucune table `support_tickets` cote backend pour l'instant — pas de donnees
// factices, un placeholder honnete + les instructions actuelles pour les
// admins (le canal e-mail support@mystreet est deja configure via Brevo).
export default function CommunicationsSupportPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/communications/notifications", label: "Communications" },
          { label: "Support" },
        ]}
        title="Centre de support"
        description="Demandes des utilisateurs (centralisees par e-mail pour l'instant)."
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas encore de table <code>support_tickets</code>. Les demandes des
          utilisateurs arrivent par e-mail pour l&apos;instant, pas dans cet admin.
        </p>
      </NotConnectedNotice>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardBody>
            <EmptyState
              icon={<LifeBuoy className="h-5 w-5" />}
              title="Module support en cours"
              description="Les tickets seront centralises dans une prochaine iteration du backend (table support_tickets). En attendant, les demandes arrivent par e-mail."
            />
          </CardBody>
        </Card>

        <aside className="space-y-3">
          <Card>
            <CardBody className="space-y-2">
              <p className="text-label uppercase tracking-wide text-n-500">Canal actuel</p>
              <p className="text-body text-ink">support@mystreet.fr</p>
              <p className="text-caption text-n-500">
                Geree par l&apos;equipe via Brevo. Tous les emails outgoing (OTP, recus,
                notifications) passent egalement par ce relai SMTP.
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <p className="text-label uppercase tracking-wide text-n-500">SLA cibles</p>
              <ul className="space-y-1.5 text-body-sm">
                <li className="flex justify-between">
                  <span className="text-n-500">1re reponse</span>
                  <span className="tabular text-ink">&lt; 4 h</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-n-500">Resolution</span>
                  <span className="tabular text-ink">&lt; 24 h</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-n-500">Satisfaction visee</span>
                  <span className="tabular text-success">&gt; 90 %</span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </aside>
      </div>
    </div>
  );
}
