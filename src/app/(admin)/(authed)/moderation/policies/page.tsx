import {
  Ban,
  EyeOff,
  Gavel,
  HeartCrack,
  PackageX,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { NotConnectedNotice } from "@/components/admin/NotConnectedNotice";

type Policy = {
  id: string;
  title: string;
  summary: string;
  icon: React.ReactNode;
  tone: "danger" | "warning" | "info" | "neutral";
  bullets: string[];
};

const policies: Policy[] = [
  {
    id: "objets-interdits",
    title: "Objets interdits",
    summary:
      "Liste des catégories d'objets dont la mise en vente est strictement prohibée sur MyStreet.",
    icon: <PackageX className="h-4 w-4" />,
    tone: "danger",
    bullets: [
      "Contrefaçons (montres, sacs, vêtements, parfums) — retrait immédiat et sanction du vendeur.",
      "Animaux vivants, dépouilles, ivoire ou produits issus d'espèces protégées.",
      "Médicaments, compléments alimentaires non homologués, dispositifs médicaux d'occasion.",
      "Alcool sans licence vendeur certifiée, tabac, cigarettes électroniques avec liquides.",
      "Armes, répliques d'armes, munitions, sprays incapacitants, couteaux à cran d'arrêt.",
      "Documents officiels (permis, cartes d'identité, diplômes) et clés de cylindres serrurerie.",
    ],
  },
  {
    id: "annonces-trompeuses",
    title: "Annonces trompeuses",
    summary:
      "Une annonce doit décrire fidèlement l'objet, son état et son prix. Toute manipulation est sanctionnée.",
    icon: <EyeOff className="h-4 w-4" />,
    tone: "warning",
    bullets: [
      "Photos issues d'Internet, du fabricant, ou d'une autre annonce : interdit.",
      "Description ne mentionnant pas un défaut majeur (panne, casse, pièce manquante).",
      "Titre racoleur (\"NEUF\" pour un objet usagé, marque erronée) : retrait après avertissement.",
      "Prix d'appel suivi d'un changement de prix lors du contact acheteur.",
      "Annonces dupliquées multipliant artificiellement la visibilité d'un même objet.",
    ],
  },
  {
    id: "comportements-interdits",
    title: "Comportements interdits",
    summary:
      "Règles de conduite entre membres. Le respect est la base d'un voisinage marchand sain.",
    icon: <HeartCrack className="h-4 w-4" />,
    tone: "warning",
    bullets: [
      "Harcèlement, insultes, propos discriminatoires (origine, genre, religion, orientation).",
      "Pression à la vente, rendez-vous insistants après refus, contacts hors plateforme.",
      "Tentatives de phishing : liens vers de faux paiements, faux services de livraison.",
      "Spam : envoi du même message à plusieurs vendeurs, démarchage commercial.",
      "Création de faux comptes pour gonfler des avis ou contourner une suspension.",
    ],
  },
  {
    id: "transactions",
    title: "Transactions et paiements",
    summary:
      "MyStreet privilégie la rencontre locale. Les paiements doivent rester traçables et sécurisés.",
    icon: <Gavel className="h-4 w-4" />,
    tone: "info",
    bullets: [
      "Paiement en espèces autorisé uniquement lors d'une remise en main propre.",
      "Aucun virement à l'avance avant rencontre, aucun mandat cash, aucun lien externe.",
      "Pour les ventes en ligne, le paiement protégé MyStreet est obligatoire au-dessus de 100 €.",
      "Frais de port à la charge de l'acheteur sauf mention contraire dans l'annonce.",
    ],
  },
  {
    id: "donnees-personnelles",
    title: "Données personnelles et vie privée",
    summary:
      "Protection des informations partagées entre membres. Toute fuite ou diffusion est sanctionnée.",
    icon: <ShieldAlert className="h-4 w-4" />,
    tone: "info",
    bullets: [
      "Ne jamais publier l'adresse exacte d'un membre dans une annonce ou un message.",
      "Photos contenant un visage non flouté de tiers : retrait sur demande.",
      "Captures d'écran de conversations privées partagées publiquement : interdit.",
      "Respect du droit à l'oubli : suppression sous 30 jours sur demande de l'utilisateur.",
    ],
  },
  {
    id: "sanctions",
    title: "Sanctions progressives",
    summary:
      "Échelle de sanctions appliquée par l'équipe modération. Les cas graves entraînent un bannissement immédiat.",
    icon: <Ban className="h-4 w-4" />,
    tone: "danger",
    bullets: [
      "Avertissement par notification : première infraction mineure.",
      "Retrait de l'annonce et masquage temporaire (48 h) : 2e infraction ou récidive sous 30 j.",
      "Suspension du compte (7 jours) : 3 infractions cumulées ou comportement abusif avéré.",
      "Bannissement définitif : contrefaçon, fraude, harcèlement caractérisé, faux compte.",
      "Toute décision est consignée dans le journal d'audit et notifiée à l'utilisateur.",
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div className="container-admin py-8 space-y-6">
      <PageHeader
        crumbs={[
          { href: "/dashboard", label: "Tableau de bord" },
          { href: "/moderation", label: "Modération" },
          { label: "Politiques" },
        ]}
        title="Politiques de modération"
        description="Cadre de référence appliqué par l'équipe modération de MyStreet."
      />

      <NotConnectedNotice>
        <p className="font-medium">Texte de référence statique, pas de CMS de politiques.</p>
        <p className="mt-0.5 text-n-600">
          Ce contenu n&apos;est pas géré ni versionné depuis l&apos;admin (il n&apos;existe pas de
          table dédiée) — pour le modifier, il faut passer par le code.
        </p>
      </NotConnectedNotice>

      <div className="grid gap-4 lg:grid-cols-2">
        {policies.map((p) => (
          <Card key={p.id}>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
                      p.tone === "danger"
                        ? "bg-danger-soft text-danger"
                        : p.tone === "warning"
                          ? "bg-warning-soft text-warning"
                          : p.tone === "info"
                            ? "bg-info-soft text-info"
                            : "bg-n-100 text-n-700"
                    }`}
                  >
                    {p.icon}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-h3 font-medium tracking-tight text-ink">{p.title}</h2>
                    <p className="text-body-sm text-n-500">{p.summary}</p>
                  </div>
                </div>
                <Pill tone={p.tone}>{p.id}</Pill>
              </div>

              <ul className="space-y-2 border-t border-n-100 pt-3 text-body-sm text-n-700">
                {p.bullets.map((b, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-n-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
