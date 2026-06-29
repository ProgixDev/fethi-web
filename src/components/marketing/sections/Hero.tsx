"use client";

import { motion } from "motion/react";
import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "../shell/Container";
import { WaitlistForm } from "../WaitlistForm";
import { listings } from "@/lib/fixtures";
import { formatDistance, formatEuro } from "@/lib/utils/format";
import { neighborhoods } from "@/lib/fixtures/neighborhoods";
import type { Listing } from "@/lib/fixtures/listings";

const ease = [0.22, 1, 0.36, 1] as const;
const neighborhoodById = Object.fromEntries(neighborhoods.map((n) => [n.id, n.name]));

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* warm radial wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 18% 0%, rgba(200,85,61,0.10) 0%, rgba(200,85,61,0) 60%), radial-gradient(40% 40% at 88% 8%, rgba(47,107,94,0.08) 0%, rgba(47,107,94,0) 60%)",
        }}
      />
      <Container className="relative pt-12 pb-20 sm:pt-20 sm:pb-24">
        <div className="grid items-center gap-12 lg:grid-cols-[5fr_6fr] lg:gap-12 xl:gap-16">
          {/* LEFT — copy */}
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-caption font-medium text-primary-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Bientôt à Lille — septembre 2026
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.05 }}
              className="mt-6 max-w-[18ch] text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.04] tracking-[-0.02em] text-ink"
            >
              L&apos;achat-vente{" "}
              <span className="font-serif italic text-primary">entre voisins</span>.
              À deux pas de chez vous.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.15 }}
              className="mt-6 max-w-xl text-body-lg text-n-600"
            >
              Achetez, vendez, louez et proposez vos services entre voisins,
              à pied. Pas d&apos;envoi, pas d&apos;arnaque, juste votre quartier.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.25 }}
              id="waitlist"
              className="mt-8"
            >
              <WaitlistForm source="homepage" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, ease, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-caption text-n-500"
            >
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Lille intra-muros + Hellemmes, Lomme
              </span>
              <span className="hidden sm:inline">·</span>
              <span>+5 184 voisins déjà sur la liste</span>
              <span>·</span>
              <Link href="/how-it-works" className="font-medium text-n-700 hover:text-primary">
                Comment ça marche →
              </Link>
            </motion.div>
          </div>

          {/* RIGHT — video panel */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="relative"
          >
            <HeroVideo />
          </motion.div>
        </div>
      </Container>

      {/* showcase strip — listings preview */}
      <Container className="relative">
        <ListingsStrip />
      </Container>
    </section>
  );
}

function HeroVideo() {
  return (
    <div className="relative">
      {/* warm halo behind the frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] blur-2xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(200,85,61,0.18) 0%, rgba(200,85,61,0) 70%)",
        }}
      />

      {/* Desktop video — 16:9, shown on lg and above */}
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-surface shadow-strong">
          <div className="aspect-video">
            <video
              className="h-full w-full object-cover"
              src="/hero.mp4"
              poster="/hero-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
            />
          </div>
          {/* glossy top highlight, mirrors the pill button system */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/4 rounded-t-[28px] bg-gradient-to-b from-white/30 to-transparent"
          />
          {/* corner badge */}
          <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/[0.72] px-3 py-1 text-caption font-medium text-ink shadow-btn-glass backdrop-blur-[16px] backdrop-saturate-[1.4]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Vieux-Lille · 14 h 32
          </div>
        </div>
      </div>

      {/* Mobile / tablet video — 9:16 portrait, shown below lg */}
      <div className="lg:hidden">
        <div className="relative mx-auto max-w-sm overflow-hidden rounded-[28px] border border-white/60 bg-surface shadow-strong">
          <div className="aspect-[9/16]">
            <video
              className="h-full w-full object-cover"
              src="/hero-mobile.mp4"
              poster="/hero-mobile-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1/5 rounded-t-[28px] bg-gradient-to-b from-white/30 to-transparent"
          />
          <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/[0.72] px-3 py-1 text-caption font-medium text-ink shadow-btn-glass backdrop-blur-[16px] backdrop-saturate-[1.4]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Vieux-Lille · 14 h 32
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsStrip() {
  // Filter to listings with photos so the carousel always renders real imagery.
  const featured = listings.filter((l) => l.status === "active" && l.photo).slice(0, 8);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease, delay: 0.45 }}
      className="mt-14 sm:mt-20"
    >
      <div className="mb-4 flex items-center justify-between text-caption text-n-500">
        <span className="uppercase tracking-[0.14em]">Cette semaine dans le Vieux-Lille</span>
        <Link href="/buyers" className="font-medium text-n-700 hover:text-primary">
          Voir tout →
        </Link>
      </div>

      {/* Marquee: track is duplicated and animated to translateX(-50%) so the
          visible scroll wraps seamlessly. Soft horizontal mask fades both edges
          into the background instead of cutting cards mid-scroll. Pauses on
          hover and respects prefers-reduced-motion. */}
      <div
        className="group/marquee relative -mx-5 overflow-hidden sm:-mx-6 lg:-mx-8"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
        }}
      >
        <div className="flex w-max animate-marquee gap-4 px-5 motion-reduce:animate-none group-hover/marquee:[animation-play-state:paused] sm:px-6 lg:px-8">
          {[...featured, ...featured].map((l, i) => (
            <ListingCard
              key={`${l.id}-${i}`}
              listing={l}
              ariaHidden={i >= featured.length}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ListingCard({ listing, ariaHidden }: { listing: Listing; ariaHidden?: boolean }) {
  return (
    <article
      aria-hidden={ariaHidden || undefined}
      className="group relative flex h-[340px] w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-n-100 bg-surface shadow-subtle transition-all duration-300 hover:-translate-y-0.5 hover:shadow-medium"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-n-100">
        {listing.photo ? (
          <Image
            src={listing.photo}
            alt={listing.title}
            fill
            sizes="280px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-between gap-2 px-4 py-3">
        <p className="line-clamp-2 text-body-sm font-medium text-ink leading-snug">
          {listing.title}
        </p>
        <div className="flex items-center justify-between text-caption text-n-500">
          <span className="truncate">
            {neighborhoodById[listing.neighborhood] ?? listing.neighborhood} ·{" "}
            {formatDistance(listing.distanceMeters)}
          </span>
          <span className="shrink-0 text-body-sm font-semibold tabular text-primary-ink">
            {formatEuro(listing.price)}
          </span>
        </div>
      </div>
    </article>
  );
}
