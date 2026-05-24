"use client";

import * as React from "react";
import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";

// Aucun endpoint admin /support/tickets cote backend pour l'instant. On laisse
// un placeholder propre, et on garde une mini-carte d'instructions pour les
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardBody>
            <EmptyState
              icon={<LifeBuoy className="h-5 w-5" />}
              title="Module support en cours"
              description="Les tickets seront centralises dans la prochaine iteration du backend (table support_tickets). En attendant, les demandes arrivent par e-mail."
            />
          </CardBody>
        </Card>

        <aside className="space-y-3">
          <Card>
            <CardBody className="space-y-2">
              <p className="text-label uppercase tracking-wide text-n-500">Canal actuel</p>
              <p className="text-body text-ink">support@mystreet.fr</p>
              <p className="text-caption text-n-500">
                Geree par l'equipe via Brevo. Tous les emails outgoing (OTP, recus,
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
