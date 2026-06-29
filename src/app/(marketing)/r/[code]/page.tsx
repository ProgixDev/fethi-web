import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

const voices = [
  { quote: "On a vidé le grenier en une semaine. Je ne savais pas que mes voisins cherchaient autant de choses.", name: "Sophie D.", where: "Wazemmes" },
  { quote: "Le code de parrainage de Léa m'a fait gagner deux mois de MyStreet+. J'ai vendu pour 340 € en quatre semaines.", name: "Antoine R.", where: "Vieux-Lille" },
  { quote: "Mon voisin de palier m'a vendu son sapin de Noël. On se dit bonjour depuis. C'est ça MyStreet.", name: "Camille B.", where: "Vauban" },
];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const referrerName = capitalize(decodeURIComponent(code));

  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Invitation</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            <span className="font-serif italic text-primary">{referrerName}</span> vous invite sur MyStreet.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Quand MyStreet ouvre dans votre quartier, vous recevrez tous
            les deux un crédit de <strong className="text-ink">5 €</strong> à
            utiliser sur votre première transaction.
          </p>

          <WaitlistForm
            source="referral"
            referralCode={code}
            cta="Accepter l'invitation"
            className="mx-auto mt-10"
          />
          <p className="mt-3 text-caption text-n-500">
            Code utilisé : <span className="font-mono text-primary-ink">{code}</span>
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <Eyebrow>Ils ont accepté avant vous</Eyebrow>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {voices.map((v) => (
              <figure key={v.name} className="rounded-xl border border-n-100 bg-paper p-6">
                <span className="font-serif text-display italic leading-none text-primary">
                  &ldquo;
                </span>
                <blockquote className="mt-2 text-body-lg leading-relaxed text-ink">
                  {v.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-2 text-caption text-n-500">
                  <span className="h-px w-6 bg-n-300" />
                  {v.name} · {v.where}
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
