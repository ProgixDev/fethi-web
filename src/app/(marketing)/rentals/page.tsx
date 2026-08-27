import { Wrench, Refrigerator, Music, Tent, Bike, MessageCircle } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";

const categories = [
  { icon: Wrench, title: "Outils", body: "Perceuse, ponceuse, tronçonneuse, escabeau. Ce qu'on utilise deux fois par an." },
  { icon: Refrigerator, title: "Électroménager", body: "Yaourtière, machine à pâtes, gaufrier — pour tester sans acheter." },
  { icon: Music, title: "Loisirs", body: "Guitare, raquette de paddle, télescope, lecteur vinyle." },
  { icon: Tent, title: "Évènement", body: "Tente, table pliante, chaises de jardin, sono portable, percolateur." },
  { icon: Bike, title: "Vélo", body: "Vélo cargo, remorque enfant, VAE — à la journée ou au week-end." },
];

const steps = [
  { n: "01", title: "Publiez", body: "Ajoutez des photos et une description simple de l'objet." },
  { n: "02", title: "Échangez", body: "Contactez votre voisin directement dans la messagerie." },
  { n: "03", title: "Convenez", body: "Fixez librement le tarif, la durée et la remise entre vous." },
];

const contactOnly = [
  "Une annonce claire avec photos et description.",
  "Une messagerie pour poser toutes vos questions.",
  "Les modalités de location sont convenues directement entre voisins.",
];

export default function RentalsPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Locations entre voisins</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Plutôt qu'acheter,{" "}
            <span className="font-serif italic text-primary">emprunter.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Une perceuse à 80 € pour deux trous par an, c'est absurde.
            MyStreet vous permet de trouver ce que votre voisin n'utilise pas
            et de le contacter simplement, près de chez vous.
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
          <Eyebrow>Catégories</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Cinq catégories,{" "}
            <span className="font-serif italic text-primary">déjà testées.</span>
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-xl border border-n-100 bg-paper p-6">
                  <Icon className="h-7 w-7 text-primary" />
                  <h3 className="mt-5 text-h3 font-medium text-ink">{c.title}</h3>
                  <p className="mt-2 text-body-sm text-n-600">{c.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <Eyebrow>Comment ça marche</Eyebrow>
              <h2 className="mt-6 text-h1 tracking-tight text-ink">
                Publier. Échanger.{" "}
                <span className="font-serif italic text-primary">S&apos;arranger.</span>
              </h2>
            </div>
            <div className="grid gap-6 lg:col-span-8 sm:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="rounded-xl border border-n-100 bg-surface p-6">
                  <span className="font-serif text-h1 italic text-primary">{s.n}</span>
                  <h3 className="mt-4 text-h3 font-medium text-ink">{s.title}</h3>
                  <p className="mt-2 text-body-sm text-n-600">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow">
          <MessageCircle className="h-8 w-8 text-accent" />
          <h2 className="mt-4 text-h1 tracking-tight text-ink sm:text-display">
            Simplement entre{" "}
            <span className="font-serif italic text-primary">voisins.</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {contactOnly.map((s) => (
              <li key={s} className="flex gap-3 text-body text-n-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {s}
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <h2 className="text-display tracking-tight text-ink">
            Moins de placards encombrés.{" "}
            <span className="font-serif italic text-primary">Plus de voisins.</span>
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
