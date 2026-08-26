import Link from "next/link";
import { Footprints, Tag, ShieldCheck } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";
import { listings } from "@/lib/fixtures/listings";
import { neighborhoods } from "@/lib/fixtures/neighborhoods";
import { formatEuro, formatDistance } from "@/lib/utils/format";

const neighborhoodById = Object.fromEntries(
  neighborhoods.map((n) => [n.id, n.name]),
);

const benefits = [
  {
    icon: Footprints,
    title: "Marchez, pas de livraison",
    body: "Tout est à pied. Pas de point relais, pas de transporteur, pas de carton à déballer. L'objet vous attend à dix minutes.",
  },
  {
    icon: Tag,
    title: "Prix de quartier",
    body: "Sans frais de transport, les prix sont 20 à 40 % plus bas que sur les marketplaces nationales. Et négociables, comme au marché.",
  },
  {
    icon: ShieldCheck,
    title: "Voisins vérifiés",
    body: "Chaque vendeur a une note voisin et un historique. Votre paiement reste protégé jusqu'à votre confirmation de réception.",
  },
];

const faqs = [
  {
    q: "Comment je paie ?",
    a: "Carte bancaire ou Apple/Google Pay. Après votre confirmation de réception, le vendeur est payé immédiatement sous 500 € et après environ 48 h à partir de 500 €."
  },
  {
    q: "Que faire si l'objet ne correspond pas ?",
    a: "Ne confirmez pas la réception et ouvrez un litige dans l'app. Les fonds restent en attente pendant l'examen ; aucun paiement n'est versé automatiquement.",
  },
  {
    q: "Puis-je négocier le prix ?",
    a: "Oui, comme dans la vraie vie. La messagerie est ouverte avant et pendant la rencontre.",
  },
  {
    q: "Et si je veux qu'on me livre ?",
    a: "On ne propose pas (encore) ce service. MyStreet est pensé pour la rencontre à pied, dans le quartier — pas pour l'envoi.",
  },
];

export default function BuyersPage() {
  const featured = listings.filter((l) => l.status === "active").slice(0, 6);

  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Pour les acheteurs</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Achetez{" "}
            <span className="font-serif italic text-primary">à pied</span>, à des voisins.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Pas de livraison, pas de carton, pas d'inconnu à l'autre bout de
            la France. Les objets que vous cherchez sont à dix minutes de
            chez vous.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/#waitlist" size="lg">
              Rejoindre la liste
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
                <div key={b.title} className="rounded-xl border border-n-100 bg-paper p-7">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-h2 tracking-tight text-ink">{b.title}</h3>
                  <p className="mt-3 text-body text-n-600">{b.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>À deux pas</Eyebrow>
              <h2 className="mt-4 text-h1 tracking-tight text-ink sm:text-display">
                Cette semaine{" "}
                <span className="font-serif italic text-primary">dans le quartier.</span>
              </h2>
            </div>
            <Link href="/#waitlist" className="hidden text-body font-medium text-n-700 hover:text-primary sm:inline">
              S&apos;inscrire pour voir tout →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((l) => (
              <article
                key={l.id}
                className="group overflow-hidden rounded-lg border border-n-100 bg-surface shadow-subtle transition-transform duration-300 hover:-translate-y-0.5"
              >
                <div
                  className="aspect-[4/3] w-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(200,85,61,0.18) 0%, rgba(47,107,94,0.10) 100%)",
                  }}
                >
                  <div className="flex h-full items-end p-4">
                    <span className="font-serif text-h2 italic text-primary-ink/40">
                      {l.title.split(" ")[0]}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 px-4 py-3">
                  <p className="line-clamp-1 text-body font-medium text-ink">{l.title}</p>
                  <div className="flex items-center justify-between text-caption text-n-500">
                    <span>
                      {neighborhoodById[l.neighborhood] ?? l.neighborhood} · {formatDistance(l.distanceMeters)}
                    </span>
                    <span className="text-body-sm font-semibold tabular text-primary-ink">
                      {formatEuro(l.price)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink">
            Pratique.{" "}
            <span className="font-serif italic text-primary">Pas de surprise.</span>
          </h2>
          <div className="mt-12 divide-y divide-n-100 border-y border-n-100">
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

      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <h2 className="text-display tracking-tight text-ink">
            Vos voisins vendent.{" "}
            <span className="font-serif italic text-primary">Vous achetez.</span>
          </h2>
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
