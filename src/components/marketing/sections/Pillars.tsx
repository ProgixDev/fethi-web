"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Tag, Wrench } from "lucide-react";
import { Container, Section, Eyebrow } from "../shell/Container";

const pillars = [
  {
    icon: ShoppingBag,
    eyebrow: "Acheter",
    title: "Tout ce qui se trouve dans la rue d'à-côté.",
    body: "Du Peugeot des années 80 au lot de livres, ce que vos voisins n'utilisent plus. Filtrez par distance à pied.",
    href: "/buyers",
    accent: "primary",
  },
  {
    icon: Tag,
    eyebrow: "Vendre",
    title: "Vingt secondes pour publier, jamais d'envoi.",
    body: "Photographiez, fixez un prix, recevez les premières messages dans l'heure. Vous restez maître du rendez-vous.",
    href: "/sellers",
    accent: "accent",
  },
  {
    icon: Wrench,
    eyebrow: "Services & locations",
    title: "L'outil au coin de la rue, l'aide à dix mètres.",
    body: "Perceuse, escabeau, baby-sitting, jardinier d'un dimanche. Louez, demandez, rendez service contre une vraie compensation.",
    href: "/services",
    accent: "warning",
  },
] as const;

// Accent tints used as a soft corner glow on each card. They sit on top of
// the mode-aware bg-surface, so the card reads cleanly on both light and dark.
const tintGlow: Record<string, string> = {
  primary:
    "radial-gradient(70% 65% at 100% 0%, rgba(200,85,61,0.18) 0%, rgba(200,85,61,0) 70%)",
  accent:
    "radial-gradient(70% 65% at 100% 0%, rgba(47,107,94,0.18) 0%, rgba(47,107,94,0) 70%)",
  warning:
    "radial-gradient(70% 65% at 100% 0%, rgba(198,138,46,0.18) 0%, rgba(198,138,46,0) 70%)",
};

const iconTint: Record<string, string> = {
  primary: "bg-primary-soft text-primary",
  accent: "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
};

const arrowTint: Record<string, string> = {
  primary: "text-primary",
  accent: "text-accent",
  warning: "text-warning",
};

export function Pillars() {
  return (
    <Section>
      <Container>
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Trois usages, une seule app</Eyebrow>
            <h2 className="mt-4 max-w-3xl text-display tracking-[-0.02em] text-ink">
              Acheter, vendre, se rendre service — dans le même quartier.
            </h2>
          </div>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.eyebrow}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: i * 0.06 }}
            >
              <Link
                href={p.href}
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-divider bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-medium"
              >
                {/* Corner glow — adapts to both modes since it sits on bg-surface */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ background: tintGlow[p.accent] }}
                />
                <div className="relative flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-md ${iconTint[p.accent]}`}
                  >
                    <p.icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight
                    className={`h-4 w-4 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${arrowTint[p.accent]}`}
                  />
                </div>
                <p className="relative mt-8 text-label uppercase tracking-[0.14em] text-n-500">
                  {p.eyebrow}
                </p>
                <h3 className="relative mt-2 text-h2 tracking-tight text-ink">{p.title}</h3>
                <p className="relative mt-3 max-w-md text-body text-n-600">{p.body}</p>
                <span className="relative mt-auto pt-8 text-body-sm font-medium text-ink">
                  En savoir plus →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
