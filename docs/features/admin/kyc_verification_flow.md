## Feature Information

- Feature Name: KYC Verification
- Description / Goal: Let authorized operators review user verification state
  and private identity documents.
- Screens Involved: `/kyc`, `/kyc/[id]`, `/kyc/verified`, `/kyc/appeals`.
- User Inputs: Queue selection, decision status, notes.
- Backend/API Interactions: `/admin/users?kyc=*`, `/admin/users/{id}/kyc`,
  future `/me/kyc/upload`.
- Special Conditions / Rules: KYC data and documents are highly sensitive and
  must be private.
- Additional Notes: Appeals currently approximate rejected users.

---

# KYC Verification

## Purpose

KYC verification lets operators review identity evidence and set verification
state for marketplace trust and risk workflows.

## Entry Points

- Sidebar KYC link
- Dashboard KYC queue
- User profile KYC status
- Appeal/verified subroutes

## Preconditions

- Admin has KYC permission.
- KYC review record exists.
- Private document access is configured.

## Main User Flow

### Step 1 - Review Queue

User:

- Opens pending, verified, or appeals queue.

System:

- Loads users by KYC status and shows queue KPIs.

### Step 2 - Inspect KYC Detail

User:

- Opens a user KYC record.

System:

- Shows declared info, document tiles, external checks, and decision form.

### Step 3 - Save Decision

User:

- Chooses verified, rejected, review, or another allowed KYC status.

System:

- Validates permission, updates status, and writes audit trail.

## Alternate Flows

- KYC document is missing or expired.
- External check provider is unavailable.
- Rejected user appears in appeals queue.

## Edge Cases & Failure Scenarios

- Private document signed URL expires.
- User is deleted/suspended while KYC is open.
- Two operators decide the same KYC record.
- Backend returns inconsistent KYC status.

## Success State

User KYC status updates consistently across user detail, queues, and audit logs.

## Failure State

No partial decision is persisted; operator receives a clear error and retry
option.

## Backend / API Notes

- Existing wrapper updates KYC via `/admin/users/{userId}/kyc`.
- Future user upload endpoint is `/me/kyc/upload`.
- Store documents in private Storage bucket with metadata linked to KYC review.
- Audit every decision.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_kyc_queue_viewed` | Queue opened | `status` |
| `admin_kyc_record_opened` | KYC detail opened | `targetUserId` |
| `admin_kyc_decision_saved` | Decision succeeds | `targetUserId, status` |

## Security & Validation Considerations

- KYC documents must never be public.
- Access should require KYC/admin role and be audited.
- Signed URLs should be short-lived.
- Decision status must be validated server-side.

## Technical Notes / Engineering Considerations

- Index KYC status and created date.
- Avoid loading document URLs until detail page needs them.
- Use concurrency checks for decision writes.

## QA Testing Recommendations

- Pending queue.
- Verified queue.
- Rejected/appeals approximation.
- Document URL denied/expired.
- Decision success/failure.
- Permission-denied access.

## Open Questions

- Which external KYC provider will be used?
- What retention policy applies to KYC documents?

