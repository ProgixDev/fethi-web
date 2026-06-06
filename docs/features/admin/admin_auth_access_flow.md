## Feature Information

- Feature Name: Admin Auth And Access
- Description / Goal: Protect the back office and authenticate authorized
  operators.
- Screens Involved: `/login`, `/forgot-password`, `/reset-password`,
  `(admin)/(authed)/*`.
- User Inputs: Email, password, reset email, new password.
- Backend/API Interactions: `/admin/auth/login`, `/admin/auth/logout`,
  `/admin/auth/refresh`, future session middleware.
- Special Conditions / Rules: Admin route visibility is not sufficient; access
  must be enforced server-side.
- Additional Notes: Current layout has a TODO for real auth gating.

---

# Admin Auth And Access

## Purpose

Admin auth ensures only authorized MyStreet operators can access private user,
listing, moderation, finance, and KYC data.

## Entry Points

- Footer "Espace admin" link
- Direct `/login`
- Direct admin route access
- Password reset links

## Preconditions

- Auth backend exists.
- Admin role/permission records exist.
- Middleware or server-side route protection is configured.

## Main User Flow

### Step 1 - Login

User:

- Enters admin email and password.

System:

- Validates required fields.
- Calls the backend auth endpoint.
- Stores a secure session and redirects to `/dashboard` when authorized.

### Step 2 - Access Protected Route

User:

- Opens an admin route.

System:

- Verifies session and admin permission.
- Allows access or redirects to `/login`.

### Step 3 - Refresh Or Logout

User:

- Continues working or logs out.

System:

- Refreshes session when needed.
- Clears session on logout and blocks protected routes.

## Alternate Flows

- User requests password reset.
- User arrives at an admin route while logged out.
- User has a valid user account but no admin role.

## Edge Cases & Failure Scenarios

- Backend unreachable should show network error and keep user unauthenticated.
- Expired session should redirect cleanly.
- Revoked admin role should block access on the next request.
- Repeated login failures should be rate-limited server-side.

## Success State

Authorized admin reaches the dashboard and can navigate protected modules.

## Failure State

Unauthorized user remains outside the back office with clear error or redirect
behavior.

## Backend / API Notes

- Existing client wrapper uses token storage and Bearer headers.
- Production should prefer secure cookie-backed sessions for admin route gating.
- Supabase Auth can provide identity; `admin_roles` should provide authorization.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_login_started` | Login form submitted | `emailDomain` |
| `admin_login_succeeded` | Auth succeeds | `adminUserId` |
| `admin_login_failed` | Auth fails | `errorCode` |
| `admin_access_denied` | Protected route blocked | `path, reason` |

## Security & Validation Considerations

- Never expose service-role keys to the browser.
- Enforce admin roles server-side.
- Use secure, HTTP-only cookies if route middleware is responsible for gating.
- Protect reset flows from token replay and enumeration.

## Technical Notes / Engineering Considerations

- Keep auth behavior behind the API/session module.
- Avoid scattering role checks across page components only.
- Test middleware behavior separately from visual login form behavior.

## QA Testing Recommendations

- Valid admin login.
- Valid non-admin login denied.
- Wrong password.
- Backend offline.
- Expired session.
- Direct admin URL access while logged out.
- Logout prevents browser-back access to private data.

## Open Questions

- What exact admin roles are required for MVP?
- Should the adapter use Supabase Edge Functions, Next route handlers, or both
  for session handling?

