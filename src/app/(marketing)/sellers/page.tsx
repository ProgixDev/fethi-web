import { Clock, PackageOpen, Star, Check } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";

const benefits = [
  {
    icon: Clock,
    title: "20 secondes pour publier",
    body: "Trois photos, un titre, un prix. Notre app détecte la catégorie, suggère le prix, et c'est en ligne. Pas de fiche produit à remplir, pas de sous-catégorie à choisir.",
  },
  {
    icon: PackageOpen,
    title: "Pas d'envoi à gérer",
    body: "Vos acheteurs habitent à pied de chez vous. Pas de Mondial Relay, pas de scotch, pas d'étiquette à imprimer. Vous fixez un rendez-vous et vous échangez.",
  },
  {
    icon: Star,
    title: "Vendez à des voisins notés",
    body: "Chaque acheteur a une note voisin et un historique de transactions. Les arnaques classiques (mandat cash, paiement hors plateforme) sont filtrées automatiquement.",
  },
];

const tiers = [
  {
    name: "Gratuit",
    price: "0 €",
    period: "à vie",
    pitch: "Pour acheter, vendre, louer entre voisins.",
    features: [
      "Annonces illimitées",
      "Messagerie sécurisée",
      "Paiement protégé inclus",
      "Note voisin réciproque",
      "Commission 5 % côté vendeur sur les ventes finalisées",
    ],
    cta: "Commencer",
    href: "/#waitlist",
    highlight: false,
  },
  {
    name: "MyStreet+",
    price: "1,99 €",
    period: "par mois",
    pitch: "Le coup de pouce des vendeurs réguliers.",
    features: [
      "Rayon de recherche personnalisé",
      "Recherches sauvegardées avec alertes",
      "Boosts à l’unité à −50 % (à partir de 0,49 €)",
      "Support prioritaire 24 h",
      "Sans engagement, résiliable à tout moment",
    ],
    cta: "Activer MyStreet+",
    href: "/#waitlist",
    highlight: true,
  },
];

// Pre-launch: no sellers on the platform yet, so this section makes promises
// rather than fabricating quotes from customers who don't exist.
const promises = [
  {
    title: "Fini les étiquettes d'envoi",
    text: "Les acheteurs viennent à pied. Vous videz un grenier sans jamais aller à la poste.",
  },
  {
    title: "Un prix qu'on ne discute pas au rabais",
    text: "Une suggestion de prix par objet, pour vendre vite sans brader — et sans y passer la soirée.",
  },
  {
    title: "Des voisins, pas des inconnus",
    text: "Chaque transaction se fait en face à face, dans le quartier — la confiance vient avec.",
  },
];

export default function SellersPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Pour les vendeurs</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Vendez à pied,{" "}
            <span className="font-serif italic text-primary">sans bouger.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Publiez en vingt secondes, oubliez les envois, retrouvez vos
            acheteurs au coin de la rue. MyStreet est conçue pour que vendre
            soit aussi simple que de prêter un livre.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/#waitlist" size="lg">
              Commencer à vendre
            </Button>
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <div className="grid gap-8 md:grid-cols-3">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="rounded-xl border border-n-100 bg-paper p-7"
                >
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-h2 tracking-tight text-ink">
                    {b.title}
                  </h3>
                  <p className="mt-3 text-body text-n-600">{b.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container>
          <div className="text-center">
            <Eyebrow className="justify-center">Tarification</Eyebrow>
            <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
              Gratuit pour commencer.{" "}
              <span className="font-serif italic text-primary">
                Toujours juste.
              </span>
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col rounded-xl border bg-surface p-7 ${
                  t.highlight
                    ? "border-primary shadow-medium ring-1 ring-primary/20"
                    : "border-n-100"
                }`}
              >
                {t.highlight ? (
                  <Pill tone="primary" className="self-start">
                    Le plus populaire
                  </Pill>
                ) : null}
                <h3 className="mt-3 text-h2 text-ink">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-serif text-display italic text-primary">
                    {t.price}
                  </span>
                  <span className="text-body-sm text-n-500">{t.period}</span>
                </div>
                <p className="mt-3 text-body text-n-600">{t.pitch}</p>
                <ul className="mt-6 space-y-2.5">
                  {t.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-body-sm text-n-700"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex-1" />
                <Button
                  href={t.href}
                  variant={t.highlight ? "primary" : "outline"}
                  className="w-full"
                >
                  {t.cta}
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <Eyebrow>Ce qu'on vous promet</Eyebrow>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {promises.map((p) => (
              <figure
                key={p.title}
                className="rounded-xl border border-n-100 bg-paper p-6"
              >
                <h3 className="font-serif text-h2 italic leading-tight text-primary">
                  {p.title}
                </h3>
                <p className="mt-3 text-body-lg leading-relaxed text-ink">
                  {p.text}
                </p>
              </figure>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <h2 className="text-display tracking-tight text-ink">
            Votre première vente,{" "}
            <span className="font-serif italic text-primary">cette semaine.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-body-lg text-n-600">
            Inscrivez-vous : on vous prévient dès que MyStreet ouvre dans
            votre quartier.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/#waitlist" size="lg">
              Rejoindre la liste
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
