## Feature Information

- Feature Name: Communications And Settings
- Description / Goal: Let operators manage marketplace messaging surfaces and
  operational configuration.
- Screens Involved: `/communications/notifications`,
  `/communications/templates`, `/communications/announcements`,
  `/communications/support`, `/communications/blog`, `/settings/*`.
- User Inputs: Message/template fields, settings toggles, category/city values,
  API key/webhook configuration.
- Backend/API Interactions: Future notifications, templates, support tickets,
  blog/content, feature flags, webhooks, API key, city/category settings.
- Special Conditions / Rules: Support tickets and several settings are currently
  prototype/visual surfaces.
- Additional Notes: Category management overlaps with listings and settings.

---

# Communications And Settings

## Purpose

Communications tools help operators control outbound marketplace messaging.
Settings tools help configure launch cities, categories, feature flags,
integrations, webhooks, API keys, and audit records.

## Entry Points

- Sidebar communications section
- Sidebar settings section
- Command palette
- Admin detail screens linking to related configuration

## Preconditions

- Admin is authenticated.
- Admin has communications or settings permission.
- Backend resources exist for the specific submodule.

## Main User Flow

### Step 1 - Open Communications Or Settings

User:

- Opens a communications or settings route.

System:

- Renders the relevant composer, list, table, toggle, or configuration screen.

### Step 2 - Create Or Modify Configuration

User:

- Edits template, announcement, feature flag, integration, city, category, or
  webhook/API key configuration.

System:

- Validates input and permissions.
- Persists change and records audit event where sensitive.

### Step 3 - Confirm Outcome

User:

- Reviews saved state or sent/scheduled message.

System:

- Shows confirmation and updated list/detail state.

## Alternate Flows

- Support module shows email fallback because support tickets are not yet
  implemented.
- Blog/content workflow is deferred to CMS decision.
- API key creation exposes secret once, then stores only hashed value.

## Edge Cases & Failure Scenarios

- Message send fails after template save.
- Invalid webhook URL.
- Feature flag change conflicts with launch state.
- User lacks permission for sensitive setting.
- Category/city change would break existing records.

## Success State

Communication or configuration change is saved, visible, and auditable.

## Failure State

Invalid or failed changes are rejected with no partial dangerous state.

## Backend / API Notes

- Support tickets require a future `support_tickets` table or external helpdesk
  integration.
- Feature flags should be server-readable and cacheable.
- API keys should be generated server-side, hashed at rest, and scoped.
- Webhook secrets should be private and rotated.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `admin_communication_saved` | Template/announcement saved | `type` |
| `admin_setting_changed` | Setting saved | `settingType, settingId` |
| `admin_webhook_tested` | Webhook test runs | `result` |
| `admin_api_key_created` | API key created | `scope` |

## Security & Validation Considerations

- API keys and webhook secrets are sensitive and should not be recoverable after
  initial display.
- Feature flag and integration changes should be audited.
- Message content should be validated to avoid accidental bad links or invalid
  personalization tokens.

## Technical Notes / Engineering Considerations

- Treat settings writes as explicit commands, not generic client-side table edits.
- Add optimistic UI only for low-risk settings.
- Category/city changes need referential integrity checks.

## QA Testing Recommendations

- Save valid template/announcement.
- Invalid template token.
- Toggle feature flag.
- Invalid webhook URL and successful webhook test.
- API key creation one-time secret display.
- Permission-denied settings access.

## Open Questions

- Which communications are MVP-critical: notifications, email templates,
  announcements, support, or blog?
- Should support integrate with an external helpdesk or live in Supabase?

