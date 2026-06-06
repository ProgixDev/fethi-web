## Feature Information

- Feature Name: Backend API Supabase Adapter
- Description / Goal: Provide the current frontend with a real backend while
  preserving the `src/lib/api.ts` contract.
- Screens Involved: All admin modules and selected public/profile/listing
  surfaces.
- User Inputs: All authenticated admin actions and public listing/profile reads.
- Backend/API Interactions: Supabase Auth, Postgres, Storage, Edge Functions or
  Next route handlers.
- Special Conditions / Rules: RLS must be enabled on exposed tables; service-role
  access must remain server-side.
- Additional Notes: See `docs/architecture/supabase_migration_plan.md`.

---

# Backend API Supabase Adapter

## Purpose

The adapter gives the existing frontend a real backend without forcing an
immediate rewrite of every page around Supabase client calls.

## Entry Points

- `src/lib/api.ts` request wrapper
- Admin auth flow
- Admin list/detail/action pages
- Public listing/profile reads

## Preconditions

- Supabase project exists.
- Schema migrations and RLS policies are applied.
- Environment variables are configured.
- Adapter endpoints are deployed.

## Main User Flow

### Step 1 - Frontend Calls API Wrapper

User:

- Performs an action that requires backend data.

System:

- `src/lib/api.ts` sends request to `NEXT_PUBLIC_API_URL`.
- Authorization is attached when required.

### Step 2 - Adapter Handles Request

User:

- Waits for response.

System:

- Adapter verifies session/role.
- Reads or writes Supabase Postgres/Storage/Auth.
- Translates data into existing frontend response shapes.

### Step 3 - Frontend Renders Result

User:

- Sees updated data or action result.

System:

- Shows success, empty, loading, or error state based on adapter response.

## Alternate Flows

- Backend returns 401 and frontend refreshes or logs out.
- Adapter maps Supabase/Postgres error to `ApiError`.
- Endpoint is not implemented yet and returns explicit 501/feature gap.

## Edge Cases & Failure Scenarios

- RLS blocks a query because role policy is missing.
- Service-role key is accidentally unavailable server-side.
- Enum values differ between database and frontend.
- Storage signed URL expires during admin review.
- Query is slow due to missing index.

## Success State

Frontend pages continue to work through the same API wrapper while data is
persisted and authorized in Supabase.

## Failure State

Errors are mapped consistently and do not leak secrets, SQL details, or private
data.

## Backend / API Notes

- Keep service-role operations inside trusted server code.
- Translate lowercase database enums to uppercase frontend enums where needed.
- Use composite indexes for status/date/filter patterns.
- Use private helper functions for complex role checks.
- Add RLS policy tests before production.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `api_adapter_request_failed` | Adapter returns error | `path, status, code` |
| `api_adapter_rls_denied` | Policy blocks access | `path, role` |
| `api_adapter_latency_sampled` | Request completes | `path, durationMs` |

## Security & Validation Considerations

- Browser must never receive Supabase service-role key.
- Every admin endpoint must check admin role server-side.
- RLS should protect tables even if an endpoint bug occurs.
- Validate payloads server-side with schema checks.

## Technical Notes / Engineering Considerations

- Treat adapter as a deep module with stable endpoint contracts.
- Do not over-index initial schema; measure with `explain analyze`.
- Add indexes on RLS policy columns.
- Keep long-running exports and webhooks separate from normal request paths.

## QA Testing Recommendations

- Contract tests for each existing API wrapper.
- RLS tests for anon, user, admin, and service-role contexts.
- Expired session and refresh behavior.
- Permission denied responses.
- Storage signed URL lifecycle.
- Slow query detection for core admin lists.

## Open Questions

- Will the adapter be Supabase Edge Functions, Next route handlers, or hybrid?
- Which endpoint group should migrate first after auth?

