import type { MetadataRoute } from "next";

const SITE_URL = "https://mystreet.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Staff back-office — never public.
        "/dashboard",
        "/users",
        "/listings",
        "/orders",
        "/moderation",
        "/disputes",
        "/kyc",
        "/finance",
        "/analytics",
        "/communications",
        "/settings",
        "/notifications",
        "/search",
        "/refunds",
        "/activity",
        "/profile",
        "/docs",
        "/login",
        "/forgot-password",
        "/reset-password",
        // Internal UI-kit demo — not a real page.
        "/playground",
        // Route handlers.
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
