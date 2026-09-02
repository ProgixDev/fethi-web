import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeBootScript } from "@/components/providers/ThemeProvider";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MyStreet — L'achat-vente entre voisins. À deux pas de chez vous.",
    template: "%s · MyStreet",
  },
  description:
    "MyStreet est une marketplace hyperlocale pour acheter, vendre, louer et proposer des services entre voisins, à pied. Lancement à Lille en septembre 2026.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "MyStreet — L'achat-vente entre voisins",
    description:
      "Achetez, vendez, louez et proposez vos services entre voisins, à pied. Lancement à Lille en septembre 2026.",
    type: "website",
    locale: "fr_FR",
    siteName: "MyStreet",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${instrumentSans.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Sets the right `dark` class on <html> before paint to kill the
            white-flash when a user has dark mode saved. `suppressHydrationWarning`
            is required because some browser extensions (BIS, Honey, password
            managers, …) mutate <script>/<body> attributes before React hydrates
            and React would otherwise log a mismatch warning we can't fix. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeBootScript }}
        />
      </head>
      <body
        className="min-h-screen bg-paper text-ink antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
