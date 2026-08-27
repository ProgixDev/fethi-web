import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";

const tier = {
  name: "Gratuit",
  price: "0 €",
  period: "à vie",
  pitch: "Pour acheter, vendre, louer entre voisins.",
  features: [
    "Annonces illimitées",
    "Messagerie chiffrée illimitée",
    "Paiement sécurisé inclus",
    "Note voisin réciproque",
    "Modération humaine 7 j/7",
    "Support par e-mail",
  ],
  cta: "Démarrer gratuitement",
  href: "/#waitlist",
};

const boosts = [
  { duration: "24 h", price: "0,99 €", note: "Idéal pour donner un coup de pouce avant le week-end." },
  { duration: "7 j", price: "4,99 €", note: "L’option la plus utilisée par les vendeurs réguliers." },
  { duration: "30 j", price: "14,99 €", note: "Pour les annonces de meubles ou objets à plus de 100 €." },
];

const faqs = [
  {
    q: "Comment fonctionne la commission de 5 % ?",
    a: "Lors d’une vente finalisée dans l’app, MyStreet retient 5 % du prix sur la part du vendeur — pour couvrir le paiement protégé, le service de litige et la modération. L’acheteur paie le prix affiché, sans surplus.",
  },
  {
    q: "Quels moyens de paiement ?",
    a: "Carte bancaire, Apple Pay, Google Pay. Le prélèvement SEPA arrive courant 2027.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Tarification</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Gratuit pour{" "}
            <span className="font-serif italic text-primary">acheter, vendre et louer.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Pas de pub, pas de revente de données, pas de frais d’inscription.
            MyStreet vit uniquement de sa commission de 5&nbsp;% sur les ventes finalisées.
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <div className="mx-auto max-w-md">
            <div className="flex flex-col rounded-xl border border-n-100 bg-paper p-7">
              <h3 className="mt-3 text-h2 text-ink">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-serif text-display italic text-primary">{tier.price}</span>
                <span className="text-body-sm text-n-500">{tier.period}</span>
              </div>
              <p className="mt-3 text-body text-n-600">{tier.pitch}</p>
              <ul className="mt-6 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body-sm text-n-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex-1" />
              <Button href={tier.href} variant="primary" className="w-full">
                {tier.cta}
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <Eyebrow>Boosts à l’unité</Eyebrow>
              <h2 className="mt-4 text-display tracking-[-0.02em] text-ink">
                Mettez en avant{" "}
                <span className="font-serif italic text-primary">une seule annonce.</span>
              </h2>
              <p className="mt-4 max-w-md text-body text-n-600">
                Chaque boost remonte votre annonce dans la carte du quartier
                pour une durée fixe. Sans abonnement. Sans engagement.
              </p>
            </div>
            <ul className="space-y-3">
              {boosts.map((b) => (
                <li
                  key={b.duration}
                  className="flex items-center justify-between gap-6 rounded-lg border border-n-100 bg-surface px-5 py-4"
                >
                  <div>
                    <p className="text-h3 font-medium text-ink">Boost {b.duration}</p>
                    <p className="text-body-sm text-n-500">{b.note}</p>
                  </div>
                  <p className="font-serif text-h2 italic text-primary tabular">{b.price}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container width="narrow">
          <Eyebrow>Questions fréquentes</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink">
            On vous dit{" "}
            <span className="font-serif italic text-primary">tout.</span>
          </h2>
          <div className="mt-10 divide-y divide-n-100 border-y border-n-100">
            {faqs.map((f) => (
              <details key={f.q} className="group py-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-body-lg font-medium text-ink">
                  {f.q}
                  <span className="mt-1 text-n-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-body text-n-600">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow" className="text-center">
          <h2 className="text-display tracking-tight text-ink">
            Commencez{" "}
            <span className="font-serif italic text-primary">gratuitement.</span>
          </h2>
          <div className="mt-8 flex justify-center">
            <Button href="/#waitlist" size="lg">Démarrer gratuitement</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
