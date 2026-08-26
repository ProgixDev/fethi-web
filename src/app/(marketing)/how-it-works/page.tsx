import Link from "next/link";
import { Camera, MessageCircle, Footprints } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    n: "01",
    title: "Photographier",
    icon: Camera,
    lead:
      "Vingt secondes, trois photos. Pas de fond blanc, pas de studio — un objet dans la lumière de votre cuisine, c'est très bien.",
    points: [
      "Trois photos suffisent. Notre app détecte la catégorie automatiquement.",
      "Le prix est suggéré à partir des ventes récentes du quartier.",
      "Pas de description obligatoire : un titre, un prix, et c'est en ligne.",
    ],
    example:
      "Marie a vendu son vélo Peugeot rue Royale en 40 minutes. Trois photos prises sur le pas de sa porte.",
  },
  {
    n: "02",
    title: "Discuter",
    icon: MessageCircle,
    lead:
      "Les voisins vous écrivent en messagerie privée. Ils sont vérifiés, notés, et habitent à pied de chez vous.",
    points: [
      "Filtre automatique sur les arnaques classiques (mandat cash, lien externe, hors-zone).",
      "Le profil affiche la rue, le nombre de transactions et la note voisin.",
      "Vous pouvez bloquer ou signaler en un clic, sans justification.",
    ],
    example:
      "Camille reçoit cinq messages en deux heures. Elle choisit Léa, qui habite trois rues plus loin et a déjà vendu sept fois.",
  },
  {
    n: "03",
    title: "Rencontrer à pied",
    icon: Footprints,
    lead:
      "Pas d'envoi, pas de point relais. Vous fixez un rendez-vous dans un café ou sur le trottoir, et vous échangez.",
    points: [
      "Le paiement sécurisé reste en attente jusqu'à votre confirmation de réception dans l'app.",
      "Le lieu est suggéré à mi-chemin entre les deux adresses.",
      "Une fois la transaction validée, chacun note l'autre.",
    ],
    example:
      "Léa et Camille se retrouvent au Café Citoyen, place du Vieux Marché. Cinq minutes, une perceuse échangée, un bonjour de plus dans la rue.",
  },
];

const faqs = [
  {
    q: "Faut-il une carte d'identité pour s'inscrire ?",
    a: "Non, l'inscription est libre. Une vérification d'identité légère (KYC) est seulement demandée au vendeur avant de recevoir le paiement d'une vente, pour sécuriser les transferts.",
  },
  {
    q: "Quels sont les frais ?",
    a: "Publier est gratuit. Quand une vente se finalise dans l'app, MyStreet retient 5 % sur la part du vendeur — pour couvrir le paiement protégé, le service de litige et la modération. L'acheteur paie le prix affiché.",
  },
  {
    q: "Que se passe-t-il si l'objet ne correspond pas ?",
    a: "Le paiement reste en attente jusqu'à la confirmation de réception par l'acheteur. Après confirmation, la part du vendeur est disponible immédiatement sous 500 € et après environ 48 h à partir de 500 €. Un litige ou l'absence de confirmation après sept jours bloque tout versement automatique et déclenche un examen.",
  },
  {
    q: "Pourquoi Lille seulement ?",
    a: "Parce qu'une marketplace de quartier n'a de sens que si la densité d'inscrits est suffisante. On préfère faire les choses bien dans une ville avant d'ouvrir ailleurs.",
  },
  {
    q: "Quand ouvrez-vous ?",
    a: "Septembre 2026, dans les quartiers Vieux-Lille, Wazemmes et Vauban d'abord. Les autres suivent au fur et à mesure des inscriptions.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Le rituel</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Photographier. Discuter.{" "}
            <span className="font-serif italic text-primary">
              Rencontrer à pied.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            MyStreet n'est pas une marketplace de plus. C'est un rituel
            hebdomadaire entre voisins, conçu pour faire moins de kilomètres
            et plus de rencontres.
          </p>
        </Container>
      </Section>

      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <Section
            key={step.n}
            className={i % 2 === 0 ? "bg-surface border-y border-divider" : "bg-paper"}
          >
            <Container>
              <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-5">
                  <div className="flex items-center gap-4">
                    <span className="font-serif text-display italic text-primary">
                      {step.n}
                    </span>
                    <Icon className="h-8 w-8 text-accent" />
                  </div>
                  <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
                    {step.title}
                  </h2>
                </div>
                <div className="lg:col-span-7">
                  <p className="text-body-lg text-n-600">{step.lead}</p>
                  <ul className="mt-8 space-y-3">
                    {step.points.map((p) => (
                      <li
                        key={p}
                        className="flex gap-3 text-body text-n-700"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 rounded-xl border border-n-100 bg-primary-soft/40 p-5">
                    <p className="text-label uppercase tracking-[0.14em] text-primary-ink">
                      Exemple concret
                    </p>
                    <p className="mt-2 text-body italic text-n-700">
                      {step.example}
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </Section>
        );
      })}

      <Section className="bg-surface border-t border-divider">
        <Container width="narrow">
          <Eyebrow>Questions fréquentes</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink">
            Tout ce qu'on nous demande{" "}
            <span className="font-serif italic text-primary">avant l'ouverture.</span>
          </h2>
          <div className="mt-12 divide-y divide-n-100 border-y border-n-100">
            {faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer items-start justify-between gap-6 text-body-lg font-medium text-ink list-none">
                  {f.q}
                  <span className="mt-1 text-n-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-body text-n-600">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <h2 className="text-display tracking-tight text-ink">
            Prêt à <span className="font-serif italic text-primary">essayer ?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-body-lg text-n-600">
            On ouvre dans votre quartier dès que cinquante voisins se sont
            inscrits. Soyez du nombre.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/#waitlist" size="lg">
              Rejoindre la liste
            </Button>
            <Link
              href="/buyers"
              className="text-body font-medium text-n-700 hover:text-primary"
            >
              Voir des annonces →
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
