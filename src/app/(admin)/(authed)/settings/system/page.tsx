import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";

export const metadata = { title: "Système" };

export default function SettingsSystemPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/settings/system", label: "Réglages" },
          { label: "Système" },
        ]}
        title="Réglages système"
        description="Aucune configuration globale connectée pour l'instant."
      />

      <NotConnectedNotice>
        <p className="font-medium">Panneau non connecté à un backend.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas de table de configuration marketplace (take rate, cycle de
          versement, mode maintenance…) — ces réglages sont aujourd&apos;hui fixés dans le code,
          pas modifiables depuis l&apos;admin.
        </p>
      </NotConnectedNotice>

      <fieldset disabled className="space-y-6">
        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <p className="text-h3 font-medium text-ink">Général</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Nom de la marketplace">
              <Input defaultValue="MyStreet" />
            </Field>
            <Field label="URL publique">
              <Input defaultValue="https://mystreet.fr" />
            </Field>
            <Field label="Take rate (%)" hint="Frais prélevés sur chaque vente">
              <Input type="number" defaultValue="5" step="0.1" />
            </Field>
            <Field label="Cycle de versement (jours)" hint="Délai après confirmation de réception">
              <Input type="number" defaultValue="2" />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <p className="text-h3 font-medium text-ink">Recherche & expédition</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Rayon par défaut (m)" hint="Distance maximale d'affichage des annonces">
              <Input type="number" defaultValue="1500" />
            </Field>
            <Field label="Mode d'expédition par défaut">
              <Select defaultValue="remise_main">
                <option value="remise_main">Remise en main propre</option>
                <option>Mondial Relay</option>
                <option>Colissimo</option>
              </Select>
            </Field>
            <Field label="Devise">
              <Select defaultValue="EUR">
                <option>EUR</option>
              </Select>
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-n-100 bg-surface p-5">
          <p className="text-h3 font-medium text-ink">Mode maintenance</p>
          <p className="mt-1 text-body-sm text-n-500">
            Quand activé, la marketplace est en lecture seule pour tous les utilisateurs.
          </p>
          <div className="mt-4">
            <Toggle checked={false} onChange={() => {}} label="Activer le mode maintenance" disabled />
          </div>
        </section>

        <div className="flex items-center justify-end gap-2 rounded-lg border border-n-100 bg-paper px-5 py-3">
          <Button variant="outline">Annuler</Button>
          <Button variant="primary">Enregistrer</Button>
        </div>
      </fieldset>
    </div>
  );
}
