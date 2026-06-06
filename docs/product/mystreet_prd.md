# MyStreet Backend-Backed MVP PRD

## Problem Statement

MyStreet has a broad, polished Next.js frontend and admin back office, but the
project is not yet backed by a complete production backend. The current repo
contains marketing pages, admin screens, typed API expectations, fixtures, and
documented product rules, but no included backend service, no enforced admin
route gating, and several data surfaces that still rely on local fixtures or
visual-only actions.

The immediate problem is to turn the existing web/admin prototype into a
backend-backed MVP without losing the product language, route surface, and admin
operator workflows already built.

## Solution

Use the existing web app as the product shell and make the backend boundary real.
The frontend should continue to treat `src/lib/api.ts` as the stable client-side
contract while the backend is implemented urgently with Supabase or an equivalent
BaaS-backed API adapter.

The first production path should prioritize:

- real admin authentication and access gating
- persisted marketplace data
- role-aware admin operations
- storage for listing photos and private KYC documents
- reports, moderation, orders, finance, and KYC workflows backed by database
  state
- a small CMS/content path for dynamic marketing content
- clear API contracts for the existing typed wrappers

## User Stories

1. As a Lille visitor, I want to understand what MyStreet does, so that I can
   decide whether it is relevant before launch.
2. As a Lille visitor, I want to see that the product is local to my city and
   neighborhood, so that the marketplace feels trustworthy.
3. As a Lille visitor, I want to understand how buying, selling, renting, and
   services work, so that I can picture the core marketplace loop.
4. As a prospective buyer, I want to understand how I can find nearby items, so
   that I can avoid delivery and meet locally.
5. As a prospective seller, I want to understand commission and boost pricing,
   so that I know what I will pay.
6. As a prospective service provider, I want to understand how services are
   represented, so that I can decide whether to list my help.
7. As a prospective renter, I want to understand how rentals work, so that I can
   safely lend or borrow locally.
8. As a pre-launch visitor, I want to join the waitlist, so that I can be
   notified when MyStreet opens in Lille.
9. As a referred visitor, I want my referral code to be recognized, so that any
   promised MyStreet+ reward is applied correctly.
10. As a visitor, I want clear safety and community guidelines, so that I know
    what behavior is expected.
11. As a visitor, I want accurate legal, privacy, and cookie pages, so that the
    pre-launch status is transparent.
12. As an admin operator, I want to sign in securely, so that only authorized
    staff can access the back office.
13. As an admin operator, I want protected admin routes, so that private
    marketplace data is not exposed publicly.
14. As an admin operator, I want a dashboard summary, so that I can see the
    current state of users, listings, KYC, reports, GMV, and operations.
15. As an admin operator, I want to search and filter users, so that I can find
    accounts requiring action.
16. As an admin operator, I want to inspect a user profile, so that I can review
    status, KYC, listings, transactions, reports, and activity in one place.
17. As an admin operator, I want to suspend or ban risky users, so that the
    marketplace remains safe.
18. As an admin operator, I want to invite admin users with roles, so that the
    team can share operational work safely.
19. As an admin operator, I want to search and filter listings, so that I can
    review active, pending, paused, sold, and archived marketplace supply.
20. As an admin operator, I want to inspect listing details, so that I can judge
    title, description, price, photos, owner, reports, and status.
21. As an admin operator, I want to update listing status, so that problematic
    or completed listings can be managed.
22. As an admin operator, I want to manage categories, so that users list items
    in a usable marketplace taxonomy.
23. As a moderation operator, I want to review reports by status and target, so
    that open safety issues are triaged quickly.
24. As a moderation operator, I want to inspect report context, so that decisions
    are based on the target listing, user, thread, or message.
25. As a moderation operator, I want to record moderation status and notes, so
    that there is an audit trail.
26. As a moderation operator, I want blocked and flagged queues, so that urgent
    abuse cases stay visible.
27. As an operations operator, I want to review orders, so that transaction state
    is clear across buyer, seller, listing, payment, and handoff.
28. As an operations operator, I want to inspect order details, so that disputes
    and refunds can be handled with context.
29. As an operations operator, I want to review disputes, so that buyer/seller
    conflicts are mediated consistently.
30. As an operations operator, I want to process refunds, so that failed or
    disputed transactions are reconciled.
31. As a finance operator, I want GMV, fees, payouts, invoices, tax, and Stripe
    sync visibility, so that marketplace money movement can be supervised.
32. As a finance operator, I want commission to be calculated at 5 percent
    seller-side, so that the business model matches the canonical copy.
33. As a finance operator, I want MyStreet+ and boosts tracked separately, so
    that subscription and one-off revenue can be understood.
34. As a KYC operator, I want a pending verification queue, so that identities
    can be reviewed before sensitive actions.
35. As a KYC operator, I want private access to KYC documents, so that personal
    data is protected.
36. As a KYC operator, I want to approve, reject, or move users into review, so
    that account state reflects verification decisions.
37. As an analytics operator, I want user, listing, marketplace, engagement,
    geo, and report analytics, so that operations can detect trends and risk.
38. As a communications operator, I want notification, template, announcement,
    and support tools, so that marketplace messages are controlled centrally.
39. As a settings operator, I want cities, categories, feature flags,
    integrations, webhooks, API keys, and audit settings, so that launch
    configuration can be managed without code changes.
40. As an engineer, I want one stable frontend API boundary, so that backend
    implementation can change without rewriting every page.
41. As an engineer, I want database-level access rules, so that bugs in frontend
    code cannot expose private marketplace data.
42. As an engineer, I want clear feature documentation, so that product,
    backend, frontend, and QA work from the same expected flows.

## Implementation Decisions

- Preserve the existing Next.js App Router structure: marketing routes stay
  separate from admin routes.
- Keep Lenis scoped to marketing; admin remains normal scroll to avoid overlay
  and command-palette conflicts.
- Treat the API client boundary as a deep module. It should hide auth token
  handling, backend URL choice, JSON error parsing, refresh behavior, and endpoint
  naming from the rest of the app.
- Implement the urgent backend using Supabase unless a dedicated backend repo is
  recovered quickly.
- Prefer a thin backend adapter that preserves the current endpoint shape over
  scattering Supabase table queries across page components.
- Model admin authorization explicitly with roles and permissions. Admin screens
  must not rely only on route visibility.
- Use Supabase Storage with separate public and private buckets: listing photos
  can be public or signed as product decides; KYC documents must be private.
- Enable Row Level Security on exposed marketplace tables and use service-role
  operations only from trusted server-side code.
- Replace fixture-backed admin surfaces incrementally by feature area, starting
  with auth, users, listings, reports, orders, and KYC.
- Keep canonical business rules in product docs and test fixtures: launch in
  Lille in September 2026, 5 percent seller-side commission, MyStreet+ at 1.99
  EUR/month, boosts at 0.99/4.99/14.99 EUR.
- Dynamic routes for blog, help, careers, and referral codes need a content or
  campaign source before production.
- Add a backend/API contract document once Supabase tables/functions are
  confirmed.

## Testing Decisions

- Tests should cover external behavior and domain outcomes, not component
  internals.
- The API client module should have focused tests for base URL selection,
  authorization headers, JSON error mapping, token persistence, and logout/refresh
  behavior.
- Auth gating should be tested at the route/middleware level: unauthenticated
  users cannot access admin routes; authorized admins can.
- User, listing, report, order, and KYC flows should have integration tests
  around loading, empty, success, permission-denied, and failed backend states.
- Database policies should be tested with user, admin, and service-role contexts
  so RLS regressions are caught before production.
- Finance calculations should be tested against the 5 percent commission rule and
  separate subscription/boost revenue.
- Feature docs should drive QA checklists for happy paths, slow network,
  expired sessions, duplicated actions, and invalid backend state.

## Out of Scope

- Native mobile app implementation.
- Full marketplace messaging implementation unless required for moderation
  report context.
- Replacing the design system or brand tokens.
- Final legal entity registration details.
- Full CMS selection and editorial tooling beyond documenting the need.
- Enterprise-scale data warehouse or BI work.
- Rewriting the entire app around direct Supabase client calls.

## Further Notes

This PRD is published as a repo document because no project issue tracker
configuration is available in the current workspace. The intended issue-tracker
label from the `to-prd` skill would be `ready-for-agent`.

