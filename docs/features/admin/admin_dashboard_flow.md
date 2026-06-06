## Feature Information

- Feature Name: Admin Dashboard
- Description / Goal: Give operators a fast overview of marketplace health and
  pending work.
- Screens Involved: `/dashboard`.
- User Inputs: Navigation clicks, queue/detail links.
- Backend/API Interactions: Analytics, users, listings, reports, orders, finance
  summary endpoints.
- Special Conditions / Rules: Fixture-backed metrics must be replaced before
  production.
- Additional Notes: Recharts SSR measurement warning is known and cosmetic.

---

# Admin Dashboard

## Purpose

The dashboard provides the first operational view for admins: user growth,
marketplace money, pending queues, top listings, open reports, and recent
activity.

## Entry Points

- Redirect after admin login
- Sidebar dashboard link
- Command palette

## Preconditions

- Admin is authenticated and authorized.
- Dashboard data endpoints or fallback empty states are available.

## Main User Flow

### Step 1 - Open Dashboard

User:

- Navigates to `/dashboard`.

System:

- Fetches summary metrics and renders KPI cards, charts, queues, and lists.
- Shows loading state while data resolves.

### Step 2 - Inspect Queue Or Metric

User:

- Clicks a queue item, top listing, report, or metric drill-down.

System:

- Routes to the relevant admin module with context preserved where practical.

## Alternate Flows

- User has permission for dashboard but not every linked module.
- Some analytics endpoints are unavailable.
- Empty pre-launch dataset.

## Edge Cases & Failure Scenarios

- API failure should render an error state per section where possible.
- Partial data should not break the whole dashboard.
- Stale cached metrics should be labelled or refreshed predictably.

## Success State

Admin sees a current operational summary and can navigate to the next action.

## Failure State

Admin sees clear error/empty states and can retry or navigate elsewhere.

## Backend / API Notes

- Suggested endpoints: dashboard summary, user analytics, listing analytics,
  report queue, finance summary, recent activity.
- Use views or materialized views only after query patterns are stable.
- Keep money values in cents.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_dashboard_viewed` | Dashboard loads | `adminUserId` |
| `admin_dashboard_card_clicked` | KPI/queue clicked | `cardId, destination` |
| `admin_dashboard_load_failed` | Data fails | `section, errorCode` |

## Security & Validation Considerations

- Dashboard queries must respect admin role permissions.
- Do not show KYC or sensitive user data to roles without access.
- Financial metrics should be server-computed, not trusted from client math.

## Technical Notes / Engineering Considerations

- Avoid N+1 data loading for dashboard cards.
- Add composite indexes for status/date queue queries.
- Consider dynamic chart import if SSR warning becomes noisy.

## QA Testing Recommendations

- Full dashboard with seeded data.
- Empty launch dataset.
- Partial endpoint failure.
- Permission-limited admin.
- Mobile/tablet layout.
- Chart rendering after hydration.

## Open Questions

- Which dashboard metrics are required on day one versus nice-to-have?
- Should finance and report summaries be real-time or periodically refreshed?

