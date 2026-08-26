import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";

const values = [
  { title: "Proximité", body: "Les distances se comptent en mètres, pas en kilomètres. La rencontre prime sur la transaction." },
  { title: "Confiance", body: "Identités vérifiées, paiements protégés, modération humaine. La méfiance ne fait pas vivre un quartier." },
  { title: "Sobriété", body: "Pas de notifications inutiles, pas de gamification. L'app sert. Elle ne capture pas l'attention." },
  { title: "Indépendance", body: "Pas de pub ciblée, pas de revente de données. La commission de 5 % finance tout le reste." },
  { title: "Durabilité", body: "Réutiliser, emprunter, partager. Une vente sur MyStreet, c'est un objet de moins fabriqué." },
];

export default function AboutPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Notre histoire</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            On voulait{" "}
            <span className="font-serif italic text-primary">moins d'écran</span>, plus de rue.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            MyStreet est née d'un agacement et d'une intuition. L'agacement,
            c'est la livraison reine. L'intuition, c'est qu'à 800 mètres,
            quelqu'un vend ce que vous cherchez.
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container width="narrow">
          <Eyebrow>Pourquoi MyStreet</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Une marketplace,{" "}
            <span className="font-serif italic text-primary">l'inverse des autres.</span>
          </h2>
          <div className="prose prose-lg mt-8 max-w-none text-n-700 prose-headings:text-ink prose-headings:font-medium prose-strong:text-ink">
            <p>
              Les marketplaces actuelles sont conçues pour effacer la
              distance. Plus loin, plus vite, plus emballé. Le voisin est
              devenu un inconnu et l'objet, un colis. Nous pensons l'inverse :
              la distance devrait <strong>compter</strong>. C'est elle qui transforme
              une transaction en rencontre.
            </p>
            <p>
              MyStreet limite délibérément le rayon à votre quartier — quinze
              minutes à pied. Pas d'envoi, pas de transporteur. Vous croisez
              l'autre personne. Vous lui dites bonjour la prochaine fois.
            </p>
            <p>
              Nous pensons aussi qu'une marketplace ne doit rien à la
              publicité ciblée. Notre seule source de revenus, c'est la
              commission sur les ventes finalisées. Cela nous oblige à être
              bons sur le produit, pas sur l'extraction d'attention.
            </p>
            <p>
              Lille en premier, parce qu'on y vit, et qu'une ville à taille
              humaine est le meilleur laboratoire. Si on y arrive, on
              avancera vers les autres métropoles, pas avant.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container width="narrow">
          <Eyebrow>Le fondateur</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Une idée née{" "}
            <span className="font-serif italic text-primary">derrière le comptoir.</span>
          </h2>
          <div className="mt-10 rounded-xl border border-n-100 bg-surface p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div
                aria-hidden
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-soft font-serif text-display italic text-primary"
              >
                F
              </div>
              <div className="space-y-3 text-body text-n-700">
                <p className="text-h3 font-medium text-ink">Fethi · 49 ans, lillois</p>
                <p>
                  Fethi tient deux bars à Lille depuis quinze ans. Il connaît
                  la rue, les visages, les habitudes des voisins qui passent
                  prendre un café avant le marché de Wazemmes ou un demi en
                  rentrant du travail.
                </p>
                <p>
                  L&apos;idée de MyStreet est venue d&apos;une scène simple :
                  trois clients du bar cherchaient le même vélo d&apos;occasion
                  un samedi matin. Un quatrième en avait un dans son garage,
                  rue d&apos;à côté. Personne ne le savait. Pendant ce temps,
                  trois colis traversaient la France pour le même besoin.
                </p>
                <p>
                  MyStreet est conçue avec le studio{" "}
                  <span className="font-medium text-ink">Progix</span> à
                  Montréal. Lancement à Lille en septembre 2026.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <Eyebrow>Nos valeurs</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Cinq principes,{" "}
            <span className="font-serif italic text-primary">non négociables.</span>
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <div key={v.title} className="rounded-xl border border-n-100 bg-paper p-6">
                <span className="font-serif text-h2 italic text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-h3 font-medium text-ink">{v.title}</h3>
                <p className="mt-2 text-body-sm text-n-600">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <h2 className="text-display tracking-tight text-ink">
            Construisez avec nous{" "}
            <span className="font-serif italic text-primary">la marketplace de votre quartier.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-body-lg text-n-600">
            On ouvre rue par rue. La vôtre est peut-être la prochaine.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/#waitlist" size="lg">Rejoindre la liste</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
