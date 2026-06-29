"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Container, Section } from "../shell/Container";
import { WaitlistForm } from "../WaitlistForm";

export function FinalCTA() {
  return (
    <Section className="bg-paper">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          // Always-dark feature surface. Static hex values so the panel stays
          // dark in both light AND dark modes — its job is to be the "deep
          // ink" brand statement, not a content surface.
          className="relative overflow-hidden rounded-2xl border border-black/30 bg-[#1F2421] p-10 sm:p-16 dark:bg-[#0E0C0A] dark:border-white/5"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40% 80% at 100% 0%, rgba(200,85,61,0.35) 0%, rgba(200,85,61,0) 70%), radial-gradient(40% 80% at 0% 100%, rgba(47,107,94,0.25) 0%, rgba(47,107,94,0) 70%)",
            }}
          />
          <div className="relative max-w-2xl">
            <p className="text-label uppercase tracking-[0.14em] text-[#FBF8F4]/60">
              Lille, septembre 2026
            </p>
            <h2 className="mt-4 text-display tracking-[-0.02em] text-[#FBF8F4]">
              Restons{" "}
              <span className="font-serif italic text-primary">
                à pied de chez nous.
              </span>
            </h2>
            <p className="mt-5 max-w-lg text-body-lg text-[#FBF8F4]/70">
              Quinze rues, mille voisins, pas une livraison. MyStreet ouvre dans
              votre quartier — on commence par le vôtre si vous nous laissez votre
              adresse e-mail.
            </p>
            <WaitlistForm source="footer" tone="dark" className="mt-8" />
            <p className="mt-3 text-caption text-[#FBF8F4]/50">
              Pas de spam. Une seule alerte quand on ouvre dans votre quartier.{" "}
              <Link href="/privacy" className="underline-offset-2 hover:underline">
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
