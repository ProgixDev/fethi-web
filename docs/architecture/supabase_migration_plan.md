# Supabase Migration Plan

## Purpose

This document describes how to move the current MyStreet web/admin prototype
toward a Supabase-backed MVP while preserving the existing frontend contract in
`src/lib/api.ts`.

The goal is urgent delivery with a clean exit path. Supabase should provide the
first real backend surface, but the frontend should keep a stable API boundary so
the backend can later become a dedicated service if needed.

## Current Backend State

- The repo does not include a backend service.
- The frontend expects `NEXT_PUBLIC_API_URL`, defaulting to
  `http://localhost:8080`.
- `src/lib/api.ts` already defines typed wrappers for auth, users, analytics,
  categories, public profiles, listings, orders, reports, KYC, and finance.
- Some admin pages are already oriented toward backend enum names.
- Some screens still use fixtures, placeholders, or client-side aggregation.
- Admin routes under `(admin)/(authed)` are not protected yet.

## Migration Strategy

Use Supabase as the backend platform and implement a thin adapter around the
current API contract.

Recommended path:

1. Create a Supabase project for development.
2. Define the Postgres schema and enum vocabulary.
3. Configure Supabase Auth and admin roles.
4. Enable RLS on all exposed tables.
5. Create Storage buckets for public marketplace media and private KYC files.
6. Implement API adapter endpoints with Supabase Edge Functions or Next route
   handlers.
7. Point `NEXT_PUBLIC_API_URL` to the adapter.
8. Replace fixture-backed screens one module at a time.
9. Add database policy tests and API contract tests before production launch.

## Adapter Boundary

Keep the frontend-facing paths stable where practical:

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

Implementation options:

- Edge Functions only: each endpoint maps directly to Supabase Auth/Postgres.
- Next route handlers: Next proxies frontend calls to Supabase server-side.
- Hybrid: Edge Functions for backend-owned operations and Next route handlers
  for web-specific session/cookie bridging.

For urgency, use a hybrid only if admin session cookies are needed immediately.
Otherwise, Edge Functions plus the existing `src/lib/api.ts` contract is the
cleanest first step.

## Proposed Domain Schema

Use lowercase snake_case identifiers for Postgres.

Core tables:

- `profiles`: public user profile fields linked to `auth.users`.
- `admin_roles`: admin permissions by user.
- `neighborhoods`: canonical Lille neighborhoods and rollout metadata.
- `categories`: listing taxonomy.
- `listings`: marketplace supply.
- `listing_photos`: ordered media references for listings.
- `orders`: buyer/seller/listing transaction records.
- `reports`: moderation reports.
- `moderation_events`: decision and audit history.
- `kyc_reviews`: verification state and decision metadata.
- `kyc_documents`: private document references.
- `subscriptions`: MyStreet+ state.
- `boost_purchases`: one-off boost purchases.
- `payouts`: seller payout state.
- `notifications`: admin/user communication events.
- `feature_flags`: operational launch flags.
- `audit_log`: sensitive admin and system actions.

Enums:

- user status: `active`, `pending`, `suspended`, `banned`
- KYC status: `unverified`, `pending`, `review`, `verified`, `rejected`
- listing type: `vente`, `location`, `service`
- listing status: `draft`, `active`, `paused`, `sold`, `archived`
- order status: `awaiting_pickup`, `handoff_pending`, `completed`,
  `cancelled`, `refunded`, `disputed`
- report target type: `listing`, `user`, `thread`, `message`
- report status: `open`, `reviewing`, `actioned`, `dismissed`

The adapter can translate these lowercase database enums to the uppercase enums
already used by the frontend.

## RLS And Security Rules

Supabase/Postgres best-practice guidance:

- Enable Row Level Security on all tables exposed to client or authenticated
  roles.
- Do not rely only on application-level filtering for tenant/user isolation.
- Use policies with `(select auth.uid())` rather than repeatedly calling
  `auth.uid()` per row.
- Add indexes on columns used in RLS policies.
- Use `security definer` helper functions only in private schemas, with explicit
  caller identity checks and revoked direct execution where appropriate.
- Keep service-role keys server-side only.

Suggested policy model:

- Public users can read active public listings and public profile fields.
- Users can read and update only their own private profile/account records.
- Buyers and sellers can read only their own orders.
- Report authors can create reports; admins can review all reports.
- KYC documents are readable only by the owner and authorized KYC/admin roles,
  depending on product policy.
- Admin users can access admin tables only when `admin_roles` grants the required
  permission.
- Audit logs should be append-only from trusted server-side code.

## Indexing Plan

Follow the Supabase/Postgres guidance that multi-column filters should use
composite indexes with equality columns first and range/sort columns last.

High-priority indexes:

- `profiles(status, created_at)`
- `profiles(kyc_status, created_at)`
- `profiles(neighborhood_id, created_at)`
- `admin_roles(user_id, role)`
- `listings(status, created_at)`
- `listings(listing_type, status, created_at)`
- `listings(owner_id, created_at)`
- `listings(category_id, status, created_at)`
- `listings(neighborhood_id, status, created_at)`
- `orders(buyer_id, created_at)`
- `orders(seller_id, created_at)`
- `orders(status, created_at)`
- `reports(status, created_at)`
- `reports(target_type, target_id)`
- `kyc_reviews(status, created_at)`
- `moderation_events(report_id, created_at)`

Use partial indexes for queues where filters are selective:

- open or reviewing reports
- pending KYC reviews
- active listings
- unpaid or disputed orders

Use covering indexes only after measuring query plans. Do not over-index the
initial schema.

## Constraints And Migration Safety

Follow Supabase/Postgres migration best practices:

- Add primary keys and foreign keys explicitly.
- Use `not null` for required domain fields.
- Add check constraints for non-negative money amounts and bounded percentages.
- Add unique constraints for slugs, stable category identifiers, and one active
  subscription per user.
- Avoid unsupported `add constraint if not exists`; use safe `do $$` blocks when
  migrations must be idempotent.
- Add foreign-key indexes explicitly for high-traffic relationships.
- Keep transactions short and avoid long-running locks during migration.

Money should be stored in integer cents. Percentages should not be represented as
floating point values.

## Storage Buckets

Recommended buckets:

- `listing-photos`: marketplace listing photos.
- `avatars`: user avatars.
- `kyc-documents`: private identity documents.
- `admin-exports`: temporary CSV/XLSX exports.

Rules:

- KYC documents must be private and accessed through signed URLs or server-side
  admin endpoints.
- Public listing media can be public only if product accepts permanent public
  URLs. Otherwise use signed URLs.
- File metadata should be stored in Postgres and linked to owning records.
- Upload actions should validate MIME type, size, owner, and target entity
  server-side.

## Auth And Sessions

Urgent path:

- Use Supabase Auth for admin identity.
- Add `admin_roles` and check it server-side for every admin endpoint.
- Store browser session in a secure shape compatible with Next middleware.
- Add middleware to block `(admin)/(authed)` routes when no valid admin session
  exists.

Do not rely on `localStorage` tokens for final admin security. The existing
client token store can be an interim bridge, but production admin gating should
use secure cookies and server-side checks.

## Data Migration From Fixtures

Fixture files can become seed data:

- users -> `profiles`
- listings -> `listings`, `listing_photos`
- orders -> `orders`
- reports -> `reports`
- neighborhoods -> `neighborhoods`
- metrics/activity -> not primary data; derive from source tables or seed
  analytics snapshots only for demo purposes

Process:

1. Normalize fixture IDs and enum values.
2. Insert reference tables first: neighborhoods and categories.
3. Insert profiles.
4. Insert listings and listing photos.
5. Insert orders.
6. Insert reports and moderation events.
7. Run validation queries comparing record counts and aggregate money totals.

## Rollout Plan

### Phase 1 - Foundation

- Create Supabase project.
- Define schema migrations.
- Configure local env vars.
- Seed neighborhoods, categories, users, listings, orders, and reports.
- Enable RLS and baseline policies.

### Phase 2 - Auth And Admin Gate

- Wire Supabase Auth.
- Add admin role checks.
- Add admin route middleware.
- Replace visual login with real auth.

### Phase 3 - Core Admin Data

- Replace users, listings, categories, and reports APIs.
- Preserve frontend response shapes.
- Add loading, empty, and permission-denied handling where missing.

### Phase 4 - Operations

- Replace orders, refunds, disputes, KYC, and finance aggregation.
- Add private Storage access for KYC.
- Add Stripe webhook Edge Functions when payments are implemented.

### Phase 5 - Analytics And Content

- Add analytics views or materialized views for dashboard summaries.
- Replace dynamic blog/help/careers/referral placeholders with a content source.
- Add monitoring and query-plan review for high-traffic admin screens.

## Testing And Verification

- Run API contract tests for every `src/lib/api.ts` wrapper.
- Test RLS with anonymous, normal authenticated user, admin, and service-role
  contexts.
- Test that non-admin users cannot access admin endpoints or private documents.
- Test indexes with `explain analyze` for list, search, queue, and detail pages.
- Test migration scripts on a fresh database and on a database with existing
  constraints.
- Test expired sessions, revoked admin roles, and duplicate admin actions.

## Open Decisions

- Whether Edge Functions or Next route handlers should own the adapter layer.
- Whether listing photos should be public URLs or signed URLs.
- Exact admin role vocabulary and permission matrix.
- Whether messaging/thread tables are needed immediately or deferred until
  moderation requires real thread context.
- Whether blog/help/careers content should live in Supabase tables, MDX, or a
  hosted CMS.
- Whether finance analytics should be normal views, materialized views, or
  server-computed endpoint responses.

