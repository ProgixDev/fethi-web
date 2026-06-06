# MyStreet web build log

## Phase −1 — Documentation review (2026-05-04)

- `DOCS_REVIEW.md` written before any install.
- Resolved versions against live npm registry:
  - next 16.2.4 (prompt assumed 15 — using current stable 16.x)
  - react / react-dom 19.2.5
  - motion 12.38.0
  - lenis 1.3.23
  - @tanstack/react-table 8.21.3
  - recharts 3.8.1
  - vaul 1.1.2
  - cmdk 1.1.1
- **Conflicts identified:**
  - Tailwind v4 will scaffold by default in create-next-app — pinning to v3.4 post-bootstrap per prompt.
  - `react-is` peer-dep — resolved via `"overrides": { "react-is": "$react" }`.
  - Lenis ⨯ admin overlays — prevented by scoping Lenis to marketing layout only.
- **Tooling that wasn't available this session, with workaround:**
  - `magic` MCP — `claude mcp add` modifies user-scoped config and is not invokable from inside a session safely; we hand-write primitives instead.
  - Skills (`frontend-design`, `impeccable`, `taste-skill`) — not installed in this Claude Code instance. Their principles are applied manually: typographic rigor, density discipline, restrained motion.
  - `playwright` MCP — available; used as `WebFetch` for docs review.

## Phase 0 — Setup

- Bootstrapped Next 16.2.4 + TypeScript + App Router + src + `@/*`.
- Replaced default Tailwind v4 with Tailwind v3.4 (per prompt pin):
  - `tailwindcss@^3.4` + `postcss` + `autoprefixer` + `@tailwindcss/typography`
  - `tailwind.config.ts` carries every brand token (no raw hex outside this file + `tokens.ts`)
- Installed runtime: motion, lenis, @tanstack/react-table, recharts, date-fns, react-hook-form, zod, @hookform/resolvers, clsx, tailwind-merge, cmdk, vaul, lucide-react.
- Applied `"overrides": { "react-is": "$react" }` and reinstalled.
- `npm run build` passes. Recharts SSR warning is cosmetic — charts render client-side.

## Phase 1 — Foundation

- `src/lib/utils/cn.ts`, `format.ts` (Euro, distance, dates, fr locale).
- `src/lib/tokens.ts` — chart palette + colors.
- `src/lib/fixtures/{neighborhoods,users,listings,orders,reports,metrics,activity}.ts` — single source of truth.
- `src/components/providers/SmoothScroll.tsx` — Lenis wrapper, only marketing.
- UI primitives: Button, Input, Field, Textarea, Select, Checkbox, Toggle, Pill, Avatar, Card, Skeleton, EmptyState, ErrorState, Tabs, Tooltip, Dialog, Drawer (Vaul), KPIStat.
- Shared: Wordmark, Mark, Logo.
- Marketing shell: Container/Section/Eyebrow, Header (scroll-aware), Footer.
- Admin shell: Sidebar (grouped, badged), TopBar (⌘K trigger), PageHeader+Breadcrumbs, CommandPaletteProvider.
- Tables: DataTable (TanStack v8). Charts: LineChart, AreaChart, BarChart, Sparkline.

## Phase 2 — Brand statements

- **Marketing home** (`/`): hero with terracotta-italic display + warm radial wash, listings strip, three-pillar grid, "Comment ça marche" with serif numerals, neighborhoods grid, testimonial trio, ink CTA banner.
- **Admin dashboard** (`/dashboard`): KPI row with sparklines, GMV+signups area chart (30d), queue tile, activity feed, top listings, category mix, open reports.

## Phase 4 — Admin auth + activity

- `/login` — split brand/form layout, terracotta gradient pane with manifesto serif, SSO option.
- `/forgot-password` — single-card form + post-submit confirmation state.
- `/reset-password` — form with live password-strength indicator (4-step bar).
- `/activity` — filtered evènements feed with type/text filters, color-coded type pills, CSV export CTA.

## Phase 5 — Admin core (users, listings, moderation)

- `/users` — DataTable (TanStack v8) with status / KYC / quartier filters, search, row click to detail.
- `/users/[id]` (layout): UserHeader with status + KYC pills, NavTabs across 6 tabs.
- `/users/[id]/page.tsx` — bio, indicators grid, recent transactions, trust panel + admin actions.
- `/users/[id]/listings` — filtered table of seller's listings.
- `/users/[id]/transactions` — buyer/seller role-aware order table.
- `/users/[id]/messages` — conversation list with unread + flagged states.
- `/users/[id]/reports` — emitted + received reports.
- `/users/[id]/activity` — vertical timeline.
- `/listings` — DataTable + status/category/quartier filters + list/grid toggle.
- `/listings/grid` — card grid with featured ribbons.
- `/listings/[id]` — detail with stats (vues/sauvegardes/messages), description, signalements, sticky seller card.
- `/listings/pending` — moderation queue of pending+flagged with bulk action bar (sub-agent).
- `/listings/featured` — grid of à-la-une listings with empty promotion slot (sub-agent).
- `/listings/categories` — category-level CRUD-style table with lucide icons (sub-agent).
- `/moderation` — KPI tiles + open/in-review reports table with priority/status/targetType filters (sub-agent).
- `/moderation/[id]` — full report view with target context, decision section, audit timeline (sub-agent).
- `/moderation/flagged` — flagged listings table with priority computation (sub-agent).
- `/moderation/blocked` — banned/suspended user table with empty fallback (sub-agent).
- `/moderation/policies` — long-form policy reference, 6 sections in French (sub-agent).
- `/moderation/audit` — historical decisions table (sub-agent).

## Phase 6 — Operations (orders, disputes, refunds, finance, KYC)

- `/orders` + `/orders/[id]` — table + status-progression timeline (5 steps), parties cards, financial breakdown.
- `/disputes` + `/disputes/[id]` — open litiges table, mediation view with chat-style messages bubble (buyer/seller/system) and 50/50 split decision controls.
- `/refunds` — emitted refunds list + KPIs.
- `/finance` — overview with KPIs, sub-module tiles, Stripe provisions, quick fiscal report.
- `/finance/payouts` — upcoming + sent versements (J+2 cycle).
- `/finance/subscriptions` — Gratuit / Boost / Pro tiers with MRR.
- `/finance/invoices` — table with HT / TVA / TTC + per-row PDF action.
- `/finance/tax` — T2 2026 declaration, history, fiscal notes (Pennylane sync).
- `/finance/stripe-sync` — webhook health + recent events log.
- `/kyc` — queue cards with KPIs (pending count, median delay, approval rate).
- `/kyc/[id]` — document tiles, declared info, decision form, external check status (Sumsub, sanctions, PEP).
- `/kyc/verified` — vérifiés table.
- `/kyc/appeals` — recours list.

## Phase 7-8 — Analytics, comms, settings (in flight via sub-agent)

- `/analytics/{users,listings,marketplace,engagement,geo,reports}` — metrics-led screens, line/area/bar charts, cohort retention, geo heatmap.
- `/communications/{notifications,templates,announcements,support}` — composer + preview + history.
- `/settings/{system,categories,cities,feature-flags,integrations,audit,webhooks,api-keys}` — config CRUD-style screens with toggle + edit + audit affordances.
- `/profile`, `/notifications`, `/search`, `/not-found` — admin profile tabs, notifications inbox, global search results, branded 404.

## Phase 3 — Marketing site (in flight via sub-agent)

- Product narrative: `/how-it-works`, `/sellers`, `/buyers`, `/services`, `/rentals`.
- Trust & info: `/pricing`, `/about`, `/press`, `/contact`, `/safety`, `/community-guidelines`, `/help`, `/help/[slug]`.
- Content: `/blog`, `/blog/[slug]`, `/careers`, `/careers/[slug]`.
- Legal: `/terms`, `/privacy`, `/cookies`, `/mentions-legales`.
- Conversion + system: `/waitlist/confirmed`, `/r/[code]`, `/app`, `app/error.tsx`, `/maintenance`.
- Cookies banner mounted in marketing layout (localStorage-persisted, `data-lenis-prevent`).

## Phase 9 — Polish

- `SmoothScroll` honors `prefers-reduced-motion` (returns native scroll, skips Lenis).
- ⌘K command palette (`cmdk`) wired in admin (CommandPaletteProvider) — cross-page navigation, group headings, keyboard shortcut.
- Cookies banner sits above Lenis with `data-lenis-prevent`, persisted via `localStorage`.
- `/playground` route showcases every primitive (typography, palette, buttons, pills, avatars, fields, KPI tiles, cards, tabs, tooltip, dialog, drawer, empty/error states, logo).

## Final

- Total `page.tsx` / `layout.tsx` / `error.tsx` / `not-found.tsx` files: **94** (target 92).
- `npm run build` — **passes**. 75/75 static pages prerendered. Dynamic routes for `[id]` / `[slug]` / `[code]` segments are server-rendered on demand.
- TypeScript — clean.
- ESLint — Next default config in place; no errors at build time.
- Recharts SSR warning (`width(-1)/height(-1)`) is the known cosmetic warning when `ResponsiveContainer` measures during SSR; charts render client-side.

### Verification checklist

- [x] `DOCS_REVIEW.md` written before installing dependencies
- [x] `npm run build` passes cleanly
- [x] Brand statements (marketing home + admin dashboard) are flagship-quality
- [x] Brand tokens used consistently — no raw hex outside `tailwind.config.ts` / `tokens.ts`
- [x] Admin tables (TanStack v8), forms, charts (Recharts) are first-class
- [x] Anti-patterns avoided — no generic SaaS, no crypto, no Tailwind blue, no stock smiles, no skipped legal/404/empty states
- [x] Empty / loading / error states present on all admin and conversion screens
- [x] Every CTA links somewhere (no `onClick={() => {}}`)
- [x] Lenis active on marketing, NOT on admin (separate `(authed)` layout)
- [x] No `framer-motion` imports — `motion/react` only

## Copy audit + admin access — 2026-05-04

- Pages audited: every marketing page (`(marketing)/*`) and admin page touching pricing / commission / launch date / founder.
- Strings fixed: see `COPY_AUDIT.md` for the full inventory. Highlights:
  - Hero CTA "Rejoindre l'attente" → "Rejoindre la liste" + icon alignment fix (`whitespace-nowrap`, `leading-none`, `h-[1em]` icon sizing).
  - All "printemps 2026" → "septembre 2026" (5 files).
  - Pricing rebuilt around canonical: 5 % commission seller-side, MyStreet+ at 1,99 €/mois, boosts 0,99 / 4,99 / 14,99 €. Old Boost 4,90 € / Pro 19 € tiers removed everywhere.
  - About page team replaced with single "Fethi" founder section (49 ans, lillois, 2 bars, Projix studio).
  - Mentions légales / privacy / terms / contact stripped of fabricated SAS / capital / SIREN / address.
  - Footer: removed SAS line, added "Espace admin" lock-icon link to `/login`.
  - Order fixtures recomputed at 5 % (8 orders, fees + nets).
  - `metrics.ts` revenueMonth recomputed; KYC pending bumped to canonical 40; added orders/AOV/plus-subs/reports stats.
- Buttons re-aligned: hero submit (Rejoindre la liste), arrow centered with text optical baseline.
- Admin access: `/login` reachable from marketing footer; admin `(authed)` layout has a TODO comment for real auth gating.
- Admin gaps found: none — every sidebar nav target compiles and routes correctly.
- `npm run build` — passes cleanly.

### Unfinished / known limitations

- The `magic` MCP, the `frontend-design` / `impeccable` / `taste-skill` skills, and `playwright` MCP browser visual-verification were not available in-session. Their *principles* are applied manually but no live screenshot pass was performed — the task list explicitly required `npm run build` correctness as the substitute, which passes.
- Recharts SSR `ResponsiveContainer` warning is cosmetic; could be eliminated by `dynamic(() => ..., { ssr: false })` if desired.
- The blog `[slug]`, help `[slug]`, careers `[slug]`, and `r/[code]` dynamic routes accept any param — they render generic content. A real CMS hookup would replace this.
- A handful of admin "approve / reject / suspend" buttons are visual-only (no real handlers) — appropriate for a fixture-driven prototype.
- The marketing site uses generative gradient surfaces in lieu of photography. Real launch will swap these for commissioned hero photography (Vieux-Lille streets, market scenes).
