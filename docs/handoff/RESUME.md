# Resume — MyStreet web

**State at handoff (2026-05-04, after copy audit):** runnable, `npm run build`
passes, 75/75 static pages prerendered, dynamic routes server-rendered on
demand. Total app files (layouts + pages + error/not-found): 94. Copy audit
complete — see `COPY_AUDIT.md`. Marketing footer has an admin entry point
(lock icon → `/login`).

## How to run

```bash
cd /Users/macbookpro/Progix/fethi-web
npm run dev          # http://localhost:3000
npm run build        # full type check + static export
```

Visit `/` for the marketing home, `/dashboard` for the admin (no auth gate;
`/login` is the visual login form), and `/playground` to see every primitive in
one place.

## Pick up here — five concrete next things

1. **Replace generative gradient hero surfaces with commissioned photography.**
   Marketing pages (`/`, `/buyers`, `/sellers`, `/services`, `/rentals`,
   `/about`) currently use a `linear-gradient(135deg, primary-soft, accent-soft)`
   stand-in inside `aspect-[4/3]` blocks where photo would go. Three to five
   commissioned Vieux-Lille / Wazemmes street photos would unlock the brand.

2. **Wire real auth + admin gating.** `(admin)/(authed)/layout.tsx` is currently
   public. Add a `middleware.ts` that checks a session cookie and redirects to
   `/login` for any path under `(authed)`. The login form already POSTs (visually)
   then routes to `/dashboard` — replace the `setTimeout` with a real call.

3. **Hook the admin tables to live data.** `src/lib/fixtures/*` is the seed
   schema. Replace each top-level page's `import { users } from "@/lib/fixtures/users"`
   with a Supabase / Postgres / tRPC call. Server components are already async —
   just `await` the query inside the same file.

4. **Eliminate the Recharts SSR warning.** Wrap each chart wrapper in
   `dynamic(() => import('./Chart'), { ssr: false })` *or* set explicit pixel
   widths on parent containers. Search `BUILD_LOG.md` for "SSR warning" for
   context.

5. **Swap dynamic-segment placeholders for a real CMS.** `/blog/[slug]`,
   `/help/[slug]`, `/careers/[slug]`, `/r/[code]` accept any string and render
   generic content. Wire to MDX in `content/` or to Notion / Sanity.

## Map of what exists

```
src/
  app/
    (marketing)/              SmoothScroll-wrapped, with Header + Footer + Cookies banner
      page.tsx                home (brand statement)
      how-it-works, sellers, buyers, services, rentals
      pricing, about, press, contact, safety, community-guidelines
      help/page.tsx, help/[slug]/page.tsx
      blog/page.tsx, blog/[slug]/page.tsx
      careers/page.tsx, careers/[slug]/page.tsx
      terms, privacy, cookies, mentions-legales
      waitlist/confirmed, r/[code], app
    (admin)/                  bare layout (no Lenis)
      login, forgot-password, reset-password
      (authed)/               sidebar + topbar + cmdk palette
        dashboard             (brand statement)
        activity
        users, users/[id]/(layout + 6 tabs)
        listings, listings/[id], listings/(grid|pending|featured|categories)
        moderation, moderation/[id], moderation/(audit|blocked|flagged|policies)
        orders, orders/[id]
        disputes, disputes/[id]
        refunds
        finance, finance/(payouts|subscriptions|invoices|tax|stripe-sync)
        kyc, kyc/[id], kyc/(verified|appeals)
        analytics/(users|listings|marketplace|engagement|geo|reports)
        communications/(notifications|templates|announcements|support)
        settings/(system|categories|cities|feature-flags|integrations|audit|webhooks|api-keys)
        profile, notifications, search
    error.tsx, not-found.tsx
    maintenance
    playground                primitives showcase
  components/
    providers/SmoothScroll.tsx       respects prefers-reduced-motion
    marketing/{shell,sections}/      Hero, Pillars, HowItWorks, Neighborhoods, Voices, FinalCTA, Header, Footer, Container
    marketing/CookiesBanner.tsx
    admin/shell/                     Sidebar, TopBar, PageHeader, Breadcrumbs, CommandPalette
    admin/tables/DataTable.tsx       TanStack v8
    admin/charts/Chart.tsx           Recharts wrappers (LineChart, AreaChart, BarChart, Sparkline)
    admin/UserHeader.tsx
    shared/Wordmark.tsx              Wordmark, Mark, Logo
    ui/                              every primitive
  lib/
    fixtures/                        single source of truth — users, listings, orders, reports, metrics, activity, neighborhoods
    utils/{cn,format}.ts             tw merge + Euro/distance/date helpers (fr locale)
    tokens.ts                        brand colors + chart palette + motion ease
  styles/                            (empty — globals.css under app/)
```

## Documents to read in order

1. `DOCS_REVIEW.md` — every library version and React 19 compatibility decision
2. `BUILD_LOG.md` — what shipped phase by phase, including known limits
3. This file — five next-actions

## Token discipline

The brand DNA lives in **two files**, nowhere else:

- `tailwind.config.ts` (utility classes drive 99% of components)
- `src/lib/tokens.ts` (chart colors and dynamic styles that can't be utility classes)

Adding a new color, radius, or shadow? Add it to those two files, not inline.

## Things I would NOT do without checking with you first

- Adding a CMS — too many philosophy decisions (MDX vs hosted, who edits, etc.)
- Adding a real auth provider — Supabase vs Clerk vs Auth.js depends on backend
- Replacing Tailwind v3.4 with v4 — your prompt explicitly pinned v3.4. v4 would
  require rewriting `tailwind.config.ts` as `@theme` rules in CSS and re-vetting
  every primitive.
- Stripping `lucide-react` for a custom icon set — every page uses 4-8 icons; a
  swap is mechanical but high-risk for visual regressions.
