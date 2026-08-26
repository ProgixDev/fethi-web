import Link from "next/link";
import { Logo } from "@/components/shared/Wordmark";
import { AppleStoreBadge, PlayStoreBadge } from "@/components/shared/StoreBadges";

const cols = [
  {
    title: "Produit",
    links: [
      { href: "/how-it-works", label: "Comment ça marche" },
      { href: "/buyers", label: "Acheter" },
      { href: "/sellers", label: "Vendre" },
      { href: "/services", label: "Services" },
      { href: "/rentals", label: "Locations" },
      { href: "/pricing", label: "Tarifs" },
    ],
  },
  {
    title: "Confiance",
    links: [
      { href: "/safety", label: "Sécurité" },
      { href: "/community-guidelines", label: "Charte de la communauté" },
      { href: "/help", label: "Centre d'aide" },
      { href: "/contact", label: "Nous contacter" },
    ],
  },
  {
    title: "À propos",
    links: [
      { href: "/about", label: "Notre histoire" },
      { href: "/press", label: "Presse" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/terms", label: "Conditions générales" },
      { href: "/privacy", label: "Confidentialité" },
      { href: "/cookies", label: "Cookies" },
      { href: "/mentions-legales", label: "Mentions légales" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-divider bg-paper">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-body-sm text-n-500">
              L&apos;achat-vente entre voisins. À deux pas de chez vous.
              Lancement à Lille en septembre 2026.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <AppleStoreBadge size="sm" href="https://apps.apple.com/app/mystreet" />
              <PlayStoreBadge
                size="sm"
                href="https://play.google.com/store/apps/details?id=fr.mystreet"
              />
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-label font-medium tracking-wide uppercase text-n-500">
                {c.title}
              </p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-body-sm text-n-700 hover:text-ink transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-divider pt-6 sm:flex-row sm:items-center">
          <p className="text-caption text-n-500">
            © 2026 MyStreet · Conçu à Lille &amp; Montréal
          </p>
          <div className="flex items-center gap-4 text-caption text-n-500">
            <Link href="/terms" className="hover:text-n-700">CGU</Link>
            <Link href="/privacy" className="hover:text-n-700">Confidentialité</Link>
            <Link href="/cookies" className="hover:text-n-700">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
