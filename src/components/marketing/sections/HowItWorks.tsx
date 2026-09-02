"use client";

import { motion } from "motion/react";
import { Eyebrow, Section, Container } from "../shell/Container";
import { Camera, MessagesSquare, Footprints } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: Camera,
    title: "Photographiez",
    body: "Trois photos, un titre, un prix. L'app pré-remplit la catégorie et la description à votre place.",
  },
  {
    n: "02",
    icon: MessagesSquare,
    title: "Discutez",
    body: "Les acheteurs intéressés vous écrivent dans l'app. Pas d'email, pas de numéro de téléphone à donner.",
  },
  {
    n: "03",
    icon: Footprints,
    title: "Rencontrez à pied",
    body: "Vous vérifiez l'objet puis l'acheteur confirme dans l'app. Les fonds restent en attente jusque-là ; le vendeur est payé immédiatement sous 500 € et après 48 h au-delà.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how" className="bg-surface border-y border-divider">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <Eyebrow>Le rituel</Eyebrow>
            <h2 className="mt-4 text-display tracking-[-0.02em] text-ink">
              Trois gestes,
              <br />
              <span className="font-serif italic text-primary">aucun envoi.</span>
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-n-600">
              Le geste fondateur de MyStreet, c&apos;est marcher. C&apos;est ce qui rend
              chaque transaction simple — et chaque rencontre possible.
            </p>
          </div>
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
                className="grid gap-4 sm:grid-cols-[auto_1fr]"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="font-serif text-h2 italic text-primary">{s.n}</span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary-ink">
                    <s.icon className="h-5 w-5" />
                  </span>
                </div>
                <div>
                  <h3 className="text-h3 font-medium text-ink">{s.title}</h3>
                  <p className="mt-1.5 text-body text-n-600">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
