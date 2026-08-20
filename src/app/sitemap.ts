import type { MetadataRoute } from "next";

const SITE_URL = "https://mystreet.fr";

// Static marketing routes. Keep in sync with `src/app/(marketing)/*` — this is
// not derived automatically because Next has no route-group introspection API,
// so a new marketing page needs a one-line addition here too.
const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/how-it-works", priority: 0.8 },
  { path: "/buyers", priority: 0.7 },
  { path: "/sellers", priority: 0.7 },
  { path: "/rentals", priority: 0.6 },
  { path: "/services", priority: 0.6 },
  { path: "/pricing", priority: 0.7 },
  { path: "/about", priority: 0.5 },
  { path: "/safety", priority: 0.5 },
  { path: "/community-guidelines", priority: 0.4 },
  { path: "/careers", priority: 0.5 },
  { path: "/press", priority: 0.4 },
  { path: "/contact", priority: 0.5 },
  { path: "/help", priority: 0.6 },
  { path: "/blog", priority: 0.6 },
  { path: "/app", priority: 0.5 },
  { path: "/waitlist", priority: 0.6 },
  { path: "/terms", priority: 0.2 },
  { path: "/privacy", priority: 0.2 },
  { path: "/cookies", priority: 0.2 },
  { path: "/mentions-legales", priority: 0.2 },
];

// Real slugs from each section's own content source (see the matching
// page for the source array/record) — not fabricated, just enumerated here
// since Next can't introspect a dynamic route's possible params for a sitemap.
const BLOG_SLUGS = [
  "pourquoi-marcher-pour-acheter",
  "vieux-lille-marche-noel",
  "louer-plutot-qu-acheter",
  "wazemmes-portrait-vendeur",
  "anti-livraison-15-minutes",
  "comment-bien-photographier",
  "kyc-pourquoi-on-le-fait",
];

const CAREERS_SLUGS = [
  "senior-backend-engineer",
  "product-designer",
  "community-manager-lille",
  "operations-trust",
  "ios-engineer",
];

const HELP_SLUGS = ["comment-publier-une-annonce", "comment-payer-en-ligne"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    priority,
    changeFrequency: path === "/" ? "weekly" : "monthly",
  }));

  for (const slug of BLOG_SLUGS) {
    entries.push({ url: `${SITE_URL}/blog/${slug}`, priority: 0.5, changeFrequency: "monthly" });
  }
  for (const slug of CAREERS_SLUGS) {
    entries.push({ url: `${SITE_URL}/careers/${slug}`, priority: 0.4, changeFrequency: "weekly" });
  }
  for (const slug of HELP_SLUGS) {
    entries.push({ url: `${SITE_URL}/help/${slug}`, priority: 0.5, changeFrequency: "monthly" });
  }

  return entries;
}
