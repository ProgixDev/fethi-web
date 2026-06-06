## Feature Information

- Feature Name: Moderation Reports
- Description / Goal: Let moderators review reports, inspect target context, and
  record decisions.
- Screens Involved: `/moderation`, `/moderation/[id]`,
  `/moderation/flagged`, `/moderation/blocked`, `/moderation/policies`,
  `/moderation/audit`.
- User Inputs: Report filters, status decision, moderator note, target links.
- Backend/API Interactions: `/admin/reports`, `/admin/reports/{id}`,
  `/admin/reports/{id}/status`.
- Special Conditions / Rules: Report target type is `LISTING`, `USER`,
  `THREAD`, or `MESSAGE`.
- Additional Notes: Thread/message target context depends on future messaging
  backend.

---

# Moderation Reports

## Purpose

Moderation reports give operators a workflow for reviewing marketplace safety
issues and recording accountable decisions.

## Entry Points

- Sidebar moderation link
- Dashboard open reports queue
- User or listing report tab
- Search result

## Preconditions

- Admin has moderation permission.
- Reports and target records are available.
- Policy reference is accessible.

## Main User Flow

### Step 1 - Review Report Queue

User:

- Filters reports by status, target type, or priority.

System:

- Loads matching reports and queue counts.

### Step 2 - Inspect Report Detail

User:

- Opens a report.

System:

- Loads report, target context, reporter context, and audit timeline.

### Step 3 - Record Decision

User:

- Chooses status and adds moderator note.

System:

- Persists decision, updates report status, and writes audit history.

## Alternate Flows

- Open flagged listings queue.
- Open blocked users queue.
- Review policy reference before decision.
- Review historical audit entries.

## Edge Cases & Failure Scenarios

- Target was deleted or archived.
- Duplicate moderators attempt to update the same report.
- Missing thread/message backend prevents full context.
- Invalid status transition is submitted.

## Success State

Report status and moderation history reflect the decision, and queues update.

## Failure State

Decision is not partially applied; moderator sees why it failed and can retry.

## Backend / API Notes

- Report list returns paginated report records.
- Status update should accept status and optional moderator note.
- Moderation decisions should write immutable audit events.
- Consider optimistic locking or updated-at checks for concurrent decisions.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_reports_filtered` | Queue filters changed | `filters` |
| `admin_report_opened` | Report detail opened | `reportId, targetType` |
| `admin_report_decided` | Decision saved | `reportId, status` |

## Security & Validation Considerations

- Moderator role is required for report access.
- Notes may contain sensitive information and should be admin-only.
- Target context should respect privacy boundaries.
- Decision actions should be audited.

## Technical Notes / Engineering Considerations

- Index reports by status/date and target type/target id.
- Use short transactions for decision writes.
- Do not block report detail rendering if optional target enrichment fails.

## QA Testing Recommendations

- Open/review/action report.
- Missing target.
- Permission-denied moderator.
- Concurrent decision attempt.
- Queue count updates.
- Audit timeline persists.

## Open Questions

- What are the exact moderation status transition rules?
- When will thread/message target context be available?

