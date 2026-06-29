import type { Metadata } from "next";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { MarketingHeader } from "@/components/marketing/shell/Header";
import { MarketingFooter } from "@/components/marketing/shell/Footer";
import { CookiesBanner } from "@/components/marketing/CookiesBanner";

// SEO for the public marketing surface. Builds on the root layout's metadata
// (title template, metadataBase, base OpenGraph) — see src/app/layout.tsx.
export const metadata: Metadata = {
  title: {
    default: "MyStreet — L'achat-vente entre voisins, à deux pas de chez vous",
    template: "%s · MyStreet",
  },
  description:
    "Rejoignez la liste d'attente MyStreet : achetez, vendez, louez et proposez vos services entre voisins, à pied. Lancement à Lille en septembre 2026.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MyStreet — L'achat-vente entre voisins",
    description:
      "Rejoignez la liste d'attente avant l'ouverture dans votre quartier. Lancement à Lille en septembre 2026.",
    type: "website",
    locale: "fr_FR",
    siteName: "MyStreet",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="flex min-h-screen flex-col">
        <MarketingHeader />
        <main className="flex-1">{children}</main>
        <MarketingFooter />
        <CookiesBanner />
      </div>
    </SmoothScroll>
  );
}
