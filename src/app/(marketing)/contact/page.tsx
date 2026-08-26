import { LifeBuoy, MapPin } from "lucide-react";
import { Container, Section, Eyebrow } from "@/components/marketing/shell/Container";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

const cards = [
  {
    icon: LifeBuoy,
    title: "Support",
    body: "Question sur votre compte, un paiement, une annonce ou un litige — presse et partenariats inclus.",
    email: "support@mystreet.fr",
  },
];

export default function ContactPage() {
  return (
    <>
      <Section className="bg-paper">
        <Container width="narrow" className="text-center">
          <Eyebrow className="justify-center">Nous contacter</Eyebrow>
          <h1 className="mt-6 text-display tracking-tight text-ink sm:text-display-xl">
            On répond,{" "}
            <span className="font-serif italic text-primary">vraiment.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-n-600">
            Une adresse, pour tout. Ou un formulaire si vous préférez écrire
            ici.
          </p>
        </Container>
      </Section>

      <Section className="bg-surface border-y border-divider">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.title} className="rounded-xl border border-n-100 bg-paper p-6">
                    <Icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 text-h3 font-medium text-ink">{c.title}</h3>
                    <p className="mt-2 text-body-sm text-n-600">{c.body}</p>
                    <a
                      href={`mailto:${c.email}`}
                      className="mt-3 inline-block text-body font-medium text-primary hover:underline"
                    >
                      {c.email}
                    </a>
                  </div>
                );
              })}

              <div className="rounded-xl border border-n-100 bg-paper p-6">
                <MapPin className="h-6 w-6 text-accent" />
                <h3 className="mt-4 text-h3 font-medium text-ink">Notre bureau</h3>
                <p className="mt-2 text-body-sm text-n-600">
                  MyStreet (équipe basée à Lille)<br />
                  Vieux-Lille — 59000<br />
                  Studio Progix · Montréal
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <form className="rounded-2xl border border-n-100 bg-paper p-7">
                <h2 className="text-h2 tracking-tight text-ink">Écrivez-nous</h2>
                <p className="mt-2 text-body-sm text-n-600">
                  On répond sous 24-48h en semaine.
                </p>
                <div className="mt-6 space-y-4">
                  <Field label="Sujet" required>
                    <Input name="subject" placeholder="Une question sur ma vente" required />
                  </Field>
                  <Field label="E-mail" required>
                    <Input name="email" type="email" placeholder="vous@quartier.fr" required />
                  </Field>
                  <Field label="Message" required>
                    <Textarea name="message" rows={6} placeholder="Donnez-nous le contexte, on s'occupe du reste." required />
                  </Field>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-caption text-n-500">
                    En envoyant, vous acceptez notre{" "}
                    <a href="/privacy" className="underline-offset-2 hover:underline">politique de confidentialité</a>.
                  </p>
                  <Button>Envoyer</Button>
                </div>
              </form>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
