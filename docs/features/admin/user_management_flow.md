## Feature Information

- Feature Name: User Management
- Description / Goal: Let admins search, inspect, and act on marketplace users.
- Screens Involved: `/users`, `/users/[id]`, user detail tabs.
- User Inputs: Search, filters, row selection, admin actions, invite admin form.
- Backend/API Interactions: `/admin/users`, `/admin/users/meta`,
  `/admin/users/export`, `/admin/users-management`, `/users/{id}/public`.
- Special Conditions / Rules: User and KYC statuses must match backend enum
  vocabulary.
- Additional Notes: User messages tab is blocked by missing threads endpoint.

---

# User Management

## Purpose

User management gives operators a trusted account view across profile, status,
KYC, listings, transactions, reports, and activity.

## Entry Points

- Sidebar users link
- Dashboard user metric
- Search result
- Listing owner link
- Report target link

## Preconditions

- Admin is authenticated and has user-management permission.
- User data exists in the backend.

## Main User Flow

### Step 1 - Search And Filter Users

User:

- Enters text or selects status, KYC, neighborhood, page, or sort filters.

System:

- Queries paginated user data.
- Shows loading, empty, and error states.

### Step 2 - Open User Detail

User:

- Clicks a user row.

System:

- Loads profile summary and renders tabs for overview, listings, transactions,
  messages, reports, and activity.

### Step 3 - Take Admin Action

User:

- Updates status, KYC state, or invites an admin user.

System:

- Validates permissions and payload.
- Persists the change and reflects updated state.

## Alternate Flows

- Export filtered users to XLSX.
- Open user from listing/report context.
- View a user with missing optional profile fields.

## Edge Cases & Failure Scenarios

- User not found should show a not-found state.
- Pagination beyond available pages should recover to a valid page.
- Session expiry during action should redirect or prompt re-login.
- Backend returns unknown enum value; UI should show safe fallback and log it.

## Success State

Admin can find a user, understand account state, and perform authorized updates.

## Failure State

Admin sees the failed action, no optimistic state is left incorrectly applied,
and retry is available where safe.

## Backend / API Notes

- User list returns `PageResponse<AdminUserListItem>`.
- Filters include query, status, KYC, neighborhood, page, size, and sort.
- Export endpoint should enforce the same filters and permissions.
- Admin invite should validate roles server-side.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_users_searched` | Search/filter submitted | `filters` |
| `admin_user_opened` | Detail page opened | `targetUserId` |
| `admin_user_action_submitted` | Status/KYC/invite action | `action, targetUserId` |

## Security & Validation Considerations

- User PII should be visible only to authorized admins.
- Admin invites must never grant roles from client input alone.
- KYC state changes should be audited.
- Export should be permission-gated and logged.

## Technical Notes / Engineering Considerations

- Add indexes for status, KYC, neighborhood, and created date filters.
- Keep list filters URL-addressable where practical.
- Avoid loading all user tabs eagerly.

## QA Testing Recommendations

- Search by name/email.
- Filter by status and KYC.
- Empty and not-found states.
- Export permission denied.
- Invite admin validation.
- Unknown enum fallback.

## Open Questions

- What is the final admin role matrix for user actions?
- Should user exports expire or be stored in a private bucket?

