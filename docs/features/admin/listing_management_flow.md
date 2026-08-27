## Feature Information

- Feature Name: Listing Management
- Description / Goal: Let admins inspect, moderate, and organize marketplace
  listings and categories.
- Screens Involved: `/listings`, `/listings/grid`, `/listings/[id]`,
  `/listings/pending`, `/listings/featured`, `/listings/categories`.
- User Inputs: Search, filters, status actions, category CRUD, listing row/card
  clicks.
- Backend/API Interactions: `/listings`, `/listings/{id}`,
  `/admin/categories`.
- Special Conditions / Rules: Listing type is `VENTE`, `LOCATION`, or `SERVICE`;
  status is `DRAFT`, `ACTIVE`, `PAUSED`, `SOLD`, or `ARCHIVED`. LOCATION has no
  structured price and is displayed as “À convenir par message”.
- Additional Notes: Category settings overlap with settings/category routes.

---

# Listing Management

## Purpose

Listing management lets admins maintain quality marketplace supply across
active, pending, featured, archived, and categorized listings.

## Entry Points

- Sidebar listings link
- Dashboard top listing
- User detail listing tab
- Report target link
- Search result

## Preconditions

- Admin is authenticated.
- Listing and category data exists.
- Listing photos are accessible under the correct storage policy.

## Main User Flow

### Step 1 - Browse Listings

User:

- Searches or filters by type, status, category, owner, neighborhood, or price.

System:

- Loads paginated listings and supports list/grid review.

### Step 2 - Inspect Detail

User:

- Opens a listing.

System:

- Shows owner, category, photos, description, price, stats, reports, and status.

### Step 3 - Update Listing Or Category

User:

- Changes listing status or manages category metadata.

System:

- Validates permissions and writes the change.
- Refreshes visible list/detail state.

## Alternate Flows

- Admin opens pending queue.
- Admin opens featured listing screen.
- Admin edits category taxonomy from listings/categories.

## Edge Cases & Failure Scenarios

- Missing photo should show placeholder.
- Listing owner not found should not break detail page.
- Invalid status transition should be rejected server-side.
- Category with child listings should not be deleted unsafely.

## Success State

Admin can find, inspect, and update listing or category state consistently.

## Failure State

Failed updates preserve previous state and show actionable error feedback.

## Backend / API Notes

- Listing list should support filters already defined in the API wrapper.
- Category list should support parent/leaf/type filtering.
- Store money in cents and translate listing enums consistently.
- Use Storage metadata for photo ownership and ordering.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_listings_filtered` | Listing filters changed | `filters` |
| `admin_listing_opened` | Detail opened | `listingId` |
| `admin_listing_status_changed` | Status update succeeds | `listingId, status` |
| `admin_category_changed` | Category create/update/delete | `categoryId, action` |

## Security & Validation Considerations

- Admin-only status changes must be server-authorized.
- Public listing reads should expose only public-safe owner fields.
- Uploaded photos need MIME, size, and ownership validation.
- Category changes should be audited.

## Technical Notes / Engineering Considerations

- Composite indexes should support status/type/category/neighborhood filters.
- Avoid N+1 owner/category lookups in listing tables.
- Consider signed URLs if listing photos are not public.

## QA Testing Recommendations

- List and grid views.
- Filter combinations.
- Listing detail with missing optional fields.
- Status update success/failure.
- Category create/update/deactivate.
- Storage URL denied/expired cases.

## Open Questions

- Are featured listings editorial-only, paid boosts, or both?
- Should listing delete mean archive only?
