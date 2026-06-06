## Feature Information

- Feature Name: Analytics And Reporting
- Description / Goal: Give operators metrics-led views of users, listings,
  marketplace health, engagement, geography, and moderation reports.
- Screens Involved: `/analytics/users`, `/analytics/listings`,
  `/analytics/marketplace`, `/analytics/engagement`, `/analytics/geo`,
  `/analytics/reports`.
- User Inputs: Navigation, date/filter selection when implemented, report
  drill-downs.
- Backend/API Interactions: `/admin/analytics/users/*`, future listing,
  marketplace, engagement, geo, finance, and reports analytics endpoints.
- Special Conditions / Rules: Analytics should be derived from source tables
  rather than hand-maintained fixture metrics.
- Additional Notes: Some charts currently depend on fixture data.

---

# Analytics And Reporting

## Purpose

Analytics screens help operators understand marketplace health and prioritize
operational work across growth, supply, demand, engagement, geography, and risk.

## Entry Points

- Sidebar analytics section
- Dashboard metric drill-downs
- Command palette

## Preconditions

- Admin is authenticated.
- Admin has analytics permission.
- Source data or analytics views are available.

## Main User Flow

### Step 1 - Open Analytics Section

User:

- Opens one analytics route.

System:

- Loads the relevant metrics, charts, and summaries.
- Shows loading, empty, or error states where data is unavailable.

### Step 2 - Interpret Metric Or Trend

User:

- Reviews chart, table, cohort, geo, or report breakdown.

System:

- Presents values using consistent formatting and route links for drill-down.

### Step 3 - Navigate To Operational Detail

User:

- Clicks a listing, user, report, or queue reference.

System:

- Opens the matching admin module.

## Alternate Flows

- Pre-launch dataset is empty.
- Specific analytics endpoint is not implemented.
- Admin lacks access to sensitive finance or KYC-derived metrics.

## Edge Cases & Failure Scenarios

- Analytics source table is stale.
- Chart data is sparse or all zero.
- Backend returns large time-series payload.
- Metric definitions differ from canonical business rules.

## Success State

Admin sees understandable, current metrics and can navigate to related work.

## Failure State

Admin sees a scoped error or empty state without the whole analytics area
breaking.

## Backend / API Notes

- User analytics endpoints already exist in the frontend contract.
- Additional analytics should come from SQL views, materialized views, or
  endpoint aggregation.
- Money values stay in cents until formatted in UI.
- Document metric definitions before using them for launch decisions.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_analytics_viewed` | Analytics route opened | `section` |
| `admin_analytics_filter_changed` | Filter/date range changed | `section, filters` |
| `admin_analytics_drilldown_clicked` | User clicks related entity | `section, targetType` |

## Security & Validation Considerations

- Sensitive metrics should respect role permissions.
- Do not expose raw PII in aggregate analytics.
- Finance metrics must be backend-derived.

## Technical Notes / Engineering Considerations

- Use composite indexes on status/date fields feeding views.
- Use materialized views only when refresh semantics are clear.
- Keep chart components resilient to empty arrays and null values.

## QA Testing Recommendations

- Each analytics route with seeded data.
- Empty dataset.
- Partial endpoint failure.
- Permission-limited admin.
- Large time series.
- Mobile chart readability.

## Open Questions

- What is the canonical date range for launch dashboards?
- Which metrics need real-time freshness versus daily refresh?

