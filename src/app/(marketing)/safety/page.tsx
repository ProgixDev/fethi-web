import Link from "next/link";
import { ShieldAlert, Eye, Coffee, Users, Star, Flag, AlertTriangle } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";

const before = [
  { icon: Eye, title: "Vérifiez le profil", body: "Note voisin, nombre de transactions, ancienneté. Une absence d'historique n'est pas grave, mais un profil créé hier mérite plus d'attention." },
  { icon: Coffee, title: "Privilégiez un lieu public", body: "Un café, une boulangerie, le pas d'un commerce. Si l'objet est volumineux, une rue passante en plein jour." },
  { icon: Users, title: "Prévenez un proche", body: "Partagez le rendez-vous via l'app : le lieu, l'heure et le contact sont transmis à la personne de votre choix." },
];

const during = [
  { icon: ShieldAlert, title: "Paiement sécurisé MyStreet", body: "Restez dans l'app pour le règlement. Après votre confirmation de réception, le versement est immédiat sous 500 € et différé d'environ 48 h à partir de 500 €." },
  { icon: Users, title: "Témoin pour les gros montants", body: "Au-dessus de 300 €, on recommande de venir accompagné, ou de fixer le rendez-vous dans un lieu public bien fréquenté." },
];

const after = [
  { icon: Star, title: "Notez la rencontre", body: "Une note honnête et un commentaire bref aident les voisins suivants. C'est ce qui fait tenir la confiance dans le quartier." },
  { icon: Flag, title: "Signalez sans hésiter", body: "Comportement étrange, message louche, désaccord sur l'objet — un clic sur Signaler suffit. L'équipe modération répond sous 4 h." },
];

export default function SafetyPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Sécurité</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            Confiance,{" "}
            <span className="font-serif italic text-primary">à pied de chez vous.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            On a conçu MyStreet pour qu'une rencontre entre voisins soit
            simple et sereine. Voici nos règles, avant, pendant, après.
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <Eyebrow>Avant la rencontre</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Trois réflexes,{" "}
            <span className="font-serif italic text-primary">trente secondes.</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {before.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="rounded-xl border border-n-100 bg-paper p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-h3 font-medium text-ink">{b.title}</h3>
                  <p className="mt-2 text-body-sm text-n-600">{b.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container>
          <Eyebrow>Pendant</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Le paiement{" "}
            <span className="font-serif italic text-primary">protège.</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {during.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.title} className="rounded-xl border border-n-100 bg-surface p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-h3 font-medium text-ink">{d.title}</h3>
                  <p className="mt-2 text-body-sm text-n-600">{d.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <Eyebrow>Après</Eyebrow>
          <h2 className="mt-6 text-h1 tracking-tight text-ink sm:text-display">
            Notation et{" "}
            <span className="font-serif italic text-primary">signalement.</span>
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {after.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="rounded-xl border border-n-100 bg-paper p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-h3 font-medium text-ink">{a.title}</h3>
                  <p className="mt-2 text-body-sm text-n-600">{a.body}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section className="bg-paper">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-n-100 bg-surface p-8">
              <AlertTriangle className="h-7 w-7 text-warning" />
              <h2 className="mt-4 text-h2 tracking-tight text-ink">
                Que faire en cas de problème
              </h2>
              <ol className="mt-6 space-y-4 text-body text-n-700">
                <li className="flex gap-3">
                  <span className="font-serif text-h3 italic text-primary">1.</span>
                  <span><strong className="text-ink">Cessez l'échange.</strong> Quittez le rendez-vous ou la conversation, sans confrontation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-serif text-h3 italic text-primary">2.</span>
                  <span><strong className="text-ink">Signalez dans l'app.</strong> Bouton Signaler en haut de chaque profil et conversation.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-serif text-h3 italic text-primary">3.</span>
                  <span><strong className="text-ink">Écrivez au support.</strong> Notre équipe répond en moins de 4 h, week-ends compris.</span>
                </li>
              </ol>
              <Link
                href="/community-guidelines"
                className="mt-6 inline-block text-body font-medium text-primary hover:underline"
              >
                Lire la charte de la communauté →
              </Link>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-8">
              <ShieldAlert className="h-7 w-7 text-primary-ink" />
              <h2 className="mt-4 text-h2 tracking-tight text-ink">
                MyStreet ne demande jamais…
              </h2>
              <ul className="mt-6 space-y-3 text-body text-n-700">
                <li className="flex gap-2"><span className="text-primary">·</span> Votre mot de passe par email ou téléphone.</li>
                <li className="flex gap-2"><span className="text-primary">·</span> De régler en mandat cash, virement libre ou crypto.</li>
                <li className="flex gap-2"><span className="text-primary">·</span> De cliquer sur un lien externe pour confirmer un paiement.</li>
                <li className="flex gap-2"><span className="text-primary">·</span> Une copie de carte d'identité par WhatsApp ou SMS.</li>
              </ul>
              <p className="mt-6 text-body-sm text-n-600">
                Si on vous le demande, c'est une arnaque. Signalez immédiatement.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
