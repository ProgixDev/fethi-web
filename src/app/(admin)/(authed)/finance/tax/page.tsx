import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";

export const metadata = { title: "TVA" };

export default function TaxPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/finance", label: "Finance" },
          { label: "TVA" },
        ]}
        title="TVA"
        description="Aucune préparation de déclaration connectée pour l'instant."
        actions={
          <Button disabled title="Préparation de déclaration pas encore connectée à un backend">
            Préparer la CA3
          </Button>
        }
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas de table ni de calcul de déclaration TVA côté backend — cet écran
          ne peut pas encore préparer de CA3 réelle. Rapprochez-vous de votre cabinet comptable
          pour les chiffres à date.
        </p>
      </NotConnectedNotice>

      <Card>
        <CardBody className="text-body-sm text-n-700 space-y-2">
          <h3 className="text-h3 font-medium text-ink">Notes fiscales</h3>
          <p>
            MyStreet est assujettie au régime réel simplifié de la TVA. Les ventes
            entre particuliers (C2C) ne donnent pas lieu à TVA collectée par les
            vendeurs ; seule la commission MyStreet et les abonnements Boost/Pro
            sont taxables au taux normal de 20 %.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
