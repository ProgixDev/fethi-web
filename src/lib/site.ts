// The canonical public origin of the marketing site.
//
// This exists as a single constant because the value used to be duplicated in
// three places (robots.ts, sitemap.ts, layout.tsx's metadataBase). When the
// production domain moved to mastreet.fr, all three still pointed at
// mystreet.fr — a host that resolves to OVH parking and refuses HTTPS — so the
// live site advertised `<link rel="canonical" href="https://mystreet.fr"/>` and
// a sitemap full of dead URLs. Canonical tags pointing at an unreachable host
// are a de-indexing risk, so keep this as the only definition.
//
// Override with NEXT_PUBLIC_SITE_URL for preview deployments; the fallback is
// the production domain so a missing env var can never resurrect the old bug.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mastreet.fr"
).replace(/\/$/, "");
