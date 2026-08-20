import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";

// Pre-launch: no referrals have happened yet, so this doesn't fabricate quotes
// from people who don't exist.
const promises = [
  { title: "Un crédit pour vous deux", text: "5 € chacun dès votre première transaction, sans condition cachée." },
  { title: "Zéro spam", text: "Un parrainage, une invitation — on ne vous relance pas ensuite." },
  { title: "Votre quartier d'abord", text: "L'invitation ne prend effet que quand MyStreet ouvre chez vous." },
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
          <Eyebrow>Ce que vous y gagnez</Eyebrow>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {promises.map((p) => (
              <figure key={p.title} className="rounded-xl border border-n-100 bg-paper p-6">
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
    </>
  );
}
