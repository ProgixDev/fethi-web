import { Hammer, Baby, GraduationCap, Sparkles, Leaf, FileText, ShieldCheck, MessageCircle, HandCoins } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";

const categories = [
  { icon: Hammer, title: "Bricolage", body: "Étagère, robinet, meuble Ikea — un voisin bricoleur passe en vingt minutes." },
  { icon: Baby, title: "Garde d'enfants", body: "Une heure ponctuelle ou une soirée. Tous les profils sont vérifiés et notés." },
  { icon: GraduationCap, title: "Cours particuliers", body: "Maths, piano, français — donnés ou reçus à la table de la cuisine du voisin." },
  { icon: Sparkles, title: "Aide ménagère", body: "Une heure par semaine, ou un grand ménage avant un déménagement." },
  { icon: Leaf, title: "Jardinage", body: "Tonte de pelouse, taille de haie, arrosage pendant vos vacances." },
  { icon: FileText, title: "Démarches admin", body: "Un voisin patient pour démêler une déclaration CAF ou un dossier de retraite." },
];

const steps = [
  { n: "01", title: "Décrivez le besoin", body: "Quelques lignes, une plage horaire, un budget indicatif." },
  { n: "02", title: "Choisissez un voisin", body: "Vous recevez 2 à 5 propositions notées en moins d'une heure." },
  { n: "03", title: "Réglez à la fin", body: "Le paiement n'est libéré qu'une fois la prestation validée." },
];

export default function ServicesPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Services</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Le coup de main,{" "}
            <span className="font-serif italic text-primary">le pro du dimanche.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Une étagère à fixer, un cours de piano, une heure de ménage. Les
            voisins de votre rue ont des compétences. MyStreet les met en
            face de vos besoins.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/#waitlist" size="lg">
              Trouver un voisin
            </Button>
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <Eyebrow>Catégories</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Six familles,{" "}
            <span className="font-serif italic text-primary">cent compétences.</span>
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
                Trois étapes,{" "}
                <span className="font-serif italic text-primary">une heure.</span>
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
        <Container>
          <Eyebrow>Confiance</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            On vérifie,{" "}
            <span className="font-serif italic text-primary">vous décidez.</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-n-100 bg-paper p-6">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-h3 font-medium text-ink">Identité vérifiée</h3>
              <p className="mt-2 text-body-sm text-n-600">Vérification d'identité demandée à tout prestataire avant de recevoir le paiement d'une mission.</p>
            </div>
            <div className="rounded-xl border border-n-100 bg-paper p-6">
              <MessageCircle className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-h3 font-medium text-ink">Messagerie modérée</h3>
              <p className="mt-2 text-body-sm text-n-600">Filtres anti-arnaque, signalement en un clic, équipe modération joignable 7/7.</p>
            </div>
            <div className="rounded-xl border border-n-100 bg-paper p-6">
              <HandCoins className="h-6 w-6 text-accent" />
              <h3 className="mt-4 text-h3 font-medium text-ink">Paiement protégé</h3>
              <p className="mt-2 text-body-sm text-n-600">Le règlement n'est versé au prestataire qu'après validation de la mission.</p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
