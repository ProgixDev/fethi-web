# MyStreet App Features And Flows

This file is a zoomed-out product and engineering map of the current MyStreet
web app, based on `docs/handoff/RESUME.md`, `docs/handoff/BUILD_LOG.md`,
`docs/handoff/COPY_AUDIT.md`, `docs/handoff/DOCS_REVIEW.md`, and the current
API wrapper in `src/lib/api.ts`.

## Product Summary

MyStreet is a pre-launch neighborhood marketplace for Lille. The public promise
is: "L'achat-vente entre voisins. A deux pas de chez vous."

The app has two main surfaces:

- Marketing site: explains the product, builds trust, collects waitlist demand,
  and presents launch/legal information.
- Admin back office: gives operators tools for marketplace oversight: users,
  listings, moderation, orders, finance, KYC, analytics, communications, and
  settings.

The current repo is the web frontend/admin app. It references an external
backend through `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:8080`.
The backend implementation itself is not in this repository.

## Canonical Business Context

- Launch city: Lille.
- Launch timing: September 2026.
- Rollout: Lille intra-muros first, then Hellemmes and Lomme, with Roubaix,
  Tourcoing, and Villeneuve-d'Ascq later.
- Founder: Fethi, 49, Lillois, bar owner.
- Studio: Projix, Montreal.
- Legal entity: not yet constituted in the product copy; legal pages intentionally
  avoid fabricated SAS, SIREN, capital, or office details.
- Revenue model: 5 percent seller-side commission on completed in-app sales,
  MyStreet+ at 1.99 EUR/month, and optional boosts at 0.99, 4.99, and 14.99 EUR.
- Tone: French, local, practical, neighbor-to-neighbor. Avoid generic SaaS,
  over-polished stock language, and fake live-marketplace claims.

## Main User Journeys

### Public Visitor

Entry points:

- `/`
- `/how-it-works`
- `/buyers`
- `/sellers`
- `/services`
- `/rentals`
- `/pricing`
- `/about`
- `/safety`
- `/community-guidelines`
- `/help`
- `/blog`
- `/contact`

Core flow:

1. Visitor lands on the marketing homepage.
2. They learn the core marketplace loop: buy, sell, rent, or offer services
   locally.
3. They review trust, pricing, safety, and neighborhood rollout details.
4. They join the waitlist or follow a referral route.
5. They can reach legal, privacy, cookies, contact, and admin login from the
   footer.

Important implementation notes:

- The marketing layout uses `SmoothScroll` via Lenis.
- The cookies banner is mounted only on marketing surfaces and persists with
  `localStorage`.
- Current marketing visual surfaces still use gradient placeholders in several
  places. `docs/brand/IMAGE_PROMPTS.md` defines the intended photography
  direction.

### Waitlist / Referral Visitor

Entry points:

- `/waitlist/confirmed`
- `/r/[code]`
- `/app`

Core flow:

1. User joins or confirms interest in the Lille launch.
2. Referral copy can reward signups with MyStreet+ time.
3. The app page points toward mobile app availability and pre-launch conversion.

Current limitation:

- `/r/[code]` accepts any code and renders generic content. A real referral or
  campaign backend/CMS should replace this before launch.

### Admin Operator

Entry points:

- `/login`
- `/forgot-password`
- `/reset-password`
- `/dashboard`

Core flow:

1. Operator reaches `/login` from the marketing footer's "Espace admin" link.
2. Login is intended to call backend auth endpoints.
3. After login, operator lands on `/dashboard`.
4. Sidebar and command palette provide navigation across all admin modules.

Current limitation:

- `(admin)/(authed)` is not actually auth-gated yet. The docs call out a required
  `middleware.ts` session-cookie gate before production.

## Admin Module Map

### Dashboard

Route:

- `/dashboard`

Purpose:

- Marketplace overview for operators.
- Shows KPIs, GMV/signups chart, queue tile, activity feed, top listings,
  category mix, and open reports.

Data state:

- Mixed. Some sections are wired toward real backend data, while GMV chart and
  activity still depend on fixtures until dedicated backend endpoints exist.

### Users

Routes:

- `/users`
- `/users/[id]`
- `/users/[id]/listings`
- `/users/[id]/transactions`
- `/users/[id]/messages`
- `/users/[id]/reports`
- `/users/[id]/activity`

Purpose:

- Manage marketplace users and their trust/status context.
- Review profile, KYC state, roles, listings, transactions, reports, and
  activity.

Backend-facing concepts:

- `AdminUserListItem`
- user status: `ACTIVE`, `PENDING`, `SUSPENDED`, `BANNED`
- KYC status: `UNVERIFIED`, `PENDING`, `REVIEW`, `VERIFIED`, `REJECTED`
- roles
- ratings, reviews, listings count, sales count, GMV

Known gap:

- `/admin/users/{id}/threads` does not exist yet. The messages tab is explicitly
  marked as a future backend iteration.

### Listings

Routes:

- `/listings`
- `/listings/grid`
- `/listings/[id]`
- `/listings/pending`
- `/listings/featured`
- `/listings/categories`

Purpose:

- Review and manage marketplace listings.
- Support list/grid review, detail inspection, pending moderation, featured
  placement, and category management.

Backend-facing concepts:

- listing type: `VENTE`, `LOCATION`, `SERVICE`
- listing status: `DRAFT`, `ACTIVE`, `PAUSED`, `SOLD`, `ARCHIVED`
- category, owner, neighborhood, price, photos, views, favorites, distance

### Moderation

Routes:

- `/moderation`
- `/moderation/[id]`
- `/moderation/flagged`
- `/moderation/blocked`
- `/moderation/policies`
- `/moderation/audit`

Purpose:

- Review reports and enforce marketplace policy.
- Inspect targets, apply decisions, view blocked users, flagged listings, policy
  references, and audit history.

Backend-facing concepts:

- report target type: `LISTING`, `USER`, `THREAD`, `MESSAGE`
- report status: `OPEN`, `REVIEWING`, `ACTIONED`, `DISMISSED`
- moderator note

### Orders, Disputes, Refunds

Routes:

- `/orders`
- `/orders/[id]`
- `/disputes`
- `/disputes/[id]`
- `/refunds`

Purpose:

- Track completed and in-progress marketplace transactions.
- Inspect buyer/seller/listing snapshots, payment status, handoff state,
  disputes, mediation, and refunds.

Backend-facing concepts:

- order status: `AWAITING_PICKUP`, `HANDOFF_PENDING`, `COMPLETED`,
  `CANCELLED`, `REFUNDED`, `DISPUTED`
- buyer/seller confirmations
- payment intent and payment status
- amount, fee, deposit

Known gap:

- The API wrapper notes there is no dedicated `/admin/orders` endpoint yet. It
  temporarily uses `/me/orders`.

### Finance

Routes:

- `/finance`
- `/finance/payouts`
- `/finance/subscriptions`
- `/finance/invoices`
- `/finance/tax`
- `/finance/stripe-sync`

Purpose:

- Monitor GMV, fees, payouts, subscriptions, invoices, taxes, and Stripe sync.

Business rules:

- Commission is 5 percent seller-side.
- MyStreet+ is 1.99 EUR/month.
- Boosts are one-off purchases at 0.99, 4.99, and 14.99 EUR.

Known gap:

- Finance summary is currently aggregated client-side from orders while waiting
  for dedicated `/admin/analytics/finance/*` backend endpoints.

### KYC

Routes:

- `/kyc`
- `/kyc/[id]`
- `/kyc/verified`
- `/kyc/appeals`

Purpose:

- Review identity verification queues and decisions.
- Inspect declared info, document tiles, and external check status.

Known gaps:

- Appeals are approximated from rejected users because there is no dedicated
  appeals endpoint.
- `/me/kyc/upload` is referenced as a future backend route.

### Analytics

Routes:

- `/analytics/users`
- `/analytics/listings`
- `/analytics/marketplace`
- `/analytics/engagement`
- `/analytics/geo`
- `/analytics/reports`

Purpose:

- Provide operator-level performance views: user growth, listings, marketplace
  health, engagement, geography, and reports.

Current data state:

- Uses metrics-led screens and charts. Some values still come from fixtures or
  client-side aggregation pending backend analytics endpoints.

### Communications

Routes:

- `/communications/notifications`
- `/communications/templates`
- `/communications/announcements`
- `/communications/support`
- `/communications/blog`

Purpose:

- Compose and inspect marketplace communications: notifications, templates,
  announcements, support, and blog/admin content workflows.

Known gap:

- No admin `/support/tickets` backend exists yet. Support requests are described
  as arriving by email for now.

### Settings

Routes:

- `/settings/system`
- `/settings/categories`
- `/settings/cities`
- `/settings/feature-flags`
- `/settings/integrations`
- `/settings/audit`
- `/settings/webhooks`
- `/settings/api-keys`

Purpose:

- Configure operational settings, cities, categories, feature flags,
  integrations, audit records, webhooks, and API keys.

## Technical Architecture

### App Structure

- `src/app/(marketing)`: public marketing routes, wrapped in the marketing shell
  and smooth scrolling.
- `src/app/(admin)`: admin auth pages and back-office routes.
- `src/components/ui`: shared UI primitives.
- `src/components/marketing`: public shell and sections.
- `src/components/admin`: admin shell, tables, charts, and user header.
- `src/components/shared`: brand assets such as wordmark and logo.
- `src/lib/fixtures`: local seed data used by prototype or incomplete backend
  areas.
- `src/lib/api.ts`: typed API client for the external backend.
- `src/lib/tokens.ts` and `tailwind.config.ts`: brand tokens.

### API Boundary

`src/lib/api.ts` centralizes:

- API base URL: `NEXT_PUBLIC_API_URL` or `http://localhost:8080`.
- Bearer token injection.
- token storage in `localStorage`.
- login/logout/refresh.
- JSON error parsing into `ApiError`.
- typed wrappers for users, analytics, categories, public profiles, listings,
  orders, reports, KYC, and finance.

Important backend endpoints currently referenced:

- `/admin/auth/login`
- `/admin/auth/logout`
- `/admin/auth/refresh`
- `/admin/users`
- `/admin/users/meta`
- `/admin/users/export`
- `/admin/users-management`
- `/admin/analytics/users/*`
- `/admin/categories`
- `/users/{id}/public`
- `/listings`
- `/me/orders`
- `/admin/reports`
- `/admin/users/{id}/kyc`

### Design And Library Choices

- Next.js 16 with App Router.
- React 19.
- Tailwind CSS pinned to v3.4.
- Motion via `motion/react`; no `framer-motion` imports.
- Lenis only on marketing, not admin.
- TanStack Table for admin tables.
- Recharts for charts.
- Vaul for drawers.
- cmdk for admin command palette.
- lucide-react for icons.

Brand-token rule:

- Do not introduce new raw colors casually. Existing docs say brand DNA should
  live in `tailwind.config.ts` and `src/lib/tokens.ts`.

## Current State

What is solid:

- The route surface is broad and compiles.
- The marketing and admin shells exist.
- Admin navigation routes compile and are represented in the sidebar.
- UI primitives, tables, charts, empty states, and error states exist.
- Product copy has been audited against the canonical business facts.
- `npm run build` was documented as passing in the handoff.

What is not production-ready:

- No backend is included in this repo.
- Admin auth gating is not enforced.
- Some admin actions are visual-only.
- Several admin data screens still use fixtures or client-side aggregation.
- Dynamic content routes accept arbitrary params and need CMS/content backing.
- Marketing imagery is still incomplete and should be replaced with real Lille
  photography.
- Recharts has a known cosmetic SSR measurement warning.

## Recommended Next Work

1. Locate or build the backend service that implements the `src/lib/api.ts`
   contract.
2. Add real auth gating for `(admin)/(authed)` routes.
3. Replace fixture-backed admin sections with live backend calls.
4. Decide CMS/content source for blog, help, careers, and referral routes.
5. Replace gradient placeholders with commissioned or generated Lille imagery
   following `docs/brand/IMAGE_PROMPTS.md`.
6. Add a small API contract document once the backend is confirmed, so frontend
   and backend enum/status names stay aligned.
