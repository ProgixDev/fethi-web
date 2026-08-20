import Link from "next/link";
import {
  ShieldAlert,
  Banknote,
  IdCard,
  ShoppingBag,
  Users,
  Tag,
  Settings,
  Megaphone,
  ExternalLink,
  Mail,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";

export const metadata = { title: "Aide & docs admin" };

const sections = [
  {
    icon: Users,
    title: "Utilisateurs",
    href: "/users",
    items: [
      "Vérifier l’identité KYC d’un compte",
      "Suspendre / bannir / réactiver un utilisateur",
      "Forcer une réinitialisation de mot de passe",
      "Lire l’historique des transactions d’un compte",
    ],
  },
  {
    icon: Tag,
    title: "Annonces",
    href: "/listings",
    items: [
      "Approuver une annonce en attente",
      "Promouvoir une annonce À la une",
      "Retirer une annonce signalée",
      "Modifier la photo et la description",
    ],
  },
  {
    icon: ShieldAlert,
    title: "Modération",
    href: "/moderation",
    items: [
      "Traiter un signalement",
      "Comprendre les niveaux de priorité",
      "Politiques internes (objets interdits)",
      "Auditer les décisions passées",
    ],
  },
  {
    icon: ShoppingBag,
    title: "Commandes & litiges",
    href: "/orders",
    items: [
      "Lire la chronologie d’une transaction",
      "Trancher un litige (acheteur / vendeur / partage)",
      "Émettre un remboursement",
      "Suspendre temporairement les fonds",
    ],
  },
  {
    icon: Banknote,
    title: "Finance",
    href: "/finance",
    items: [
      "Cycle de versements J+2",
      "Préparer la déclaration TVA trimestrielle",
      "Re-synchroniser Stripe Connect",
      "Lire les factures clients",
    ],
  },
  {
    icon: IdCard,
    title: "KYC",
    href: "/kyc",
    items: [
      "Examiner une demande de vérification",
      "Demander une preuve complémentaire",
      "Traiter un recours après refus",
    ],
  },
  {
    icon: Megaphone,
    title: "Communications",
    href: "/communications/notifications",
    items: [
      "Composer une notification push / e-mail",
      "Modifier les templates",
      "Publier une bannière in-app",
      "Répondre à un ticket support",
    ],
  },
  {
    icon: Settings,
    title: "Paramètres système",
    href: "/settings/system",
    items: [
      "Modifier la commission ou le cycle de paiement",
      "Activer un feature flag",
      "Brancher un nouveau webhook",
      "Faire tourner les clés API",
    ],
  },
];

const playbooks = [
  {
    title: "Annonce signalée pour contrefaçon",
    steps: [
      "Ouvrir le signalement et lire le détail.",
      "Vérifier l’annonce (titre, photos, description).",
      "Si confirmé : statut → rejeté · auteur → avertissement (1er) ou suspension (2e).",
      "Notifier le signaleur de la décision via le template `report.resolved`.",
    ],
  },
  {
    title: "Litige acheteur / vendeur",
    steps: [
      "Lire l’échange complet dans /disputes/[id].",
      "Demander des preuves visuelles si nécessaire (photo de l’objet reçu).",
      "Trancher : remboursement, versement, ou partage 50/50 selon les preuves.",
      "Documenter la décision dans la note interne.",
    ],
  },
  {
    title: "KYC refusé puis recours",
    steps: [
      "Vérifier les nouvelles pièces fournies dans /kyc/appeals.",
      "Croiser avec Sumsub si disponible.",
      "Si validé : statut → vérifié · message via `kyc.approved`.",
      "Si refusé définitivement : motif clair + voie de recours hors-app.",
    ],
  },
];

export default function AdminDocsPage() {
  return (
    <div className="container-admin py-8 space-y-8">
      <PageHeader
        crumbs={[{ href: "/dashboard", label: "Tableau de bord" }, { label: "Aide & docs" }]}
        title="Aide & documentation admin"
        description="Tout ce qu’il faut savoir pour gérer la marketplace MyStreet au quotidien — playbooks, raccourcis, contacts."
      />

      <NotConnectedNotice>
        <p className="font-medium">Pas de supervision système en direct dans cet admin.</p>
        <p className="mt-0.5 text-n-600">
          Il n&apos;existe pas de monitoring d&apos;infrastructure (statut API/Stripe/Sumsub,
          version déployée) branché ici. Pour l&apos;état des services tiers, consultez leurs
          tableaux de bord respectifs.
        </p>
      </NotConnectedNotice>

      <section>
        <h2 className="text-h2 font-medium tracking-tight text-ink">Playbooks essentiels</h2>
        <p className="mt-1 text-body-sm text-n-500">
          Procédures pas-à-pas pour les trois cas qu’on traite le plus souvent.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {playbooks.map((p) => (
            <Card key={p.title}>
              <CardBody>
                <h3 className="text-h3 font-medium text-ink">{p.title}</h3>
                <ol className="mt-3 space-y-2 text-body-sm text-n-700">
                  {p.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-serif italic text-primary tabular w-5 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-medium tracking-tight text-ink">Par section</h2>
        <p className="mt-1 text-body-sm text-n-500">
          Sujets récurrents par module. Cliquez sur la carte pour ouvrir le module concerné.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.title}
                href={s.href}
                className="group rounded-lg border border-n-100 bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-medium"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-n-700">
                    <Icon className="h-4 w-4" />
                  </span>
                  <ExternalLink className="h-4 w-4 text-n-300 transition-colors group-hover:text-n-600" />
                </div>
                <p className="mt-5 text-body font-medium text-ink">{s.title}</p>
                <ul className="mt-2 space-y-1.5 text-body-sm text-n-500">
                  {s.items.map((it, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-n-300">·</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-h2 font-medium tracking-tight text-ink">Contacts d’escalade</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <ContactCard
            title="Ops & support"
            email="ops@mystreet.fr"
            note="Premier point d’escalade pour tout ce qui concerne les utilisateurs ou les annonces."
          />
          <ContactCard
            title="Finance & litiges"
            email="finance@mystreet.fr"
            note="Pour Stripe, TVA, remboursements supérieurs à 200 €, et arbitrages litigieux."
          />
          <ContactCard
            title="Légal & RGPD"
            email="dpo@mystreet.fr"
            note="Demandes des autorités, droit à l’oubli, signalements de fraude grave."
          />
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  title,
  email,
  note,
}: {
  title: string;
  email: string;
  note: string;
}) {
  return (
    <Card>
      <CardBody>
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-n-700">
          <Mail className="h-4 w-4" />
        </span>
        <p className="mt-4 text-body font-medium text-ink">{title}</p>
        <p className="mt-1 text-body-sm text-n-500">{note}</p>
        <a
          href={`mailto:${email}`}
          className="mt-3 inline-flex items-center gap-1 text-body-sm font-medium text-primary hover:text-primary-hover"
        >
          {email} →
        </a>
      </CardBody>
    </Card>
  );
}
