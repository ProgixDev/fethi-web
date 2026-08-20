"use client";

import { motion } from "motion/react";
import { Container, Section, Eyebrow } from "../shell/Container";

// Pre-launch: no real users yet, so this deliberately doesn't fabricate
// customer quotes. Once the first neighborhoods go live, swap these for real,
// attributable testimonials.
const promises = [
  {
    title: "Un café, pas un colis",
    text: "Chaque vente se conclut en personne, à deux pas de chez vous — pas dans une boîte aux lettres.",
  },
  {
    title: "Le prix juste, sans négocier à l'aveugle",
    text: "Une suggestion de prix par objet, pour vendre vite sans brader.",
  },
  {
    title: "Un quartier à la fois",
    text: "On ouvre rue par rue à Lille avant d'aller ailleurs — pas de logistique à trois cents kilomètres.",
  },
];

export function Voices() {
  return (
    <Section className="bg-surface border-y border-divider">
      <Container>
        <Eyebrow>Ce qu'on construit</Eyebrow>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {promises.map((p, i) => (
            <motion.figure
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
              className="rounded-xl border border-n-100 bg-paper p-6"
            >
              <h3 className="font-serif text-h2 italic text-primary leading-tight">
                {p.title}
              </h3>
              <p className="mt-3 text-body-lg text-ink leading-relaxed">
                {p.text}
              </p>
            </motion.figure>
          ))}
        </div>
      </Container>
    </Section>
  );
}
