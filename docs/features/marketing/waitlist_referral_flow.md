## Feature Information

- Feature Name: Waitlist And Referral Flow
- Description / Goal: Capture pre-launch Lille demand and attribute referral
  traffic or rewards.
- Screens Involved: Homepage CTA, `/waitlist/confirmed`, `/r/[code]`, `/app`.
- User Inputs: Email or waitlist intent, referral code, CTA clicks.
- Backend/API Interactions: Future waitlist and referral endpoints; currently
  placeholder/static behavior.
- Special Conditions / Rules: Referral rewards must use MyStreet+ language, not
  old Boost/Pro copy.
- Additional Notes: `/r/[code]` currently accepts any code.

---

# Waitlist And Referral Flow

## Purpose

The flow should turn interested visitors into launch leads and preserve referral
attribution for pre-launch growth.

## Entry Points

- Homepage waitlist CTA
- Footer or marketing CTAs
- Direct referral link `/r/[code]`
- App landing page `/app`

## Preconditions

- Visitor can access public pages.
- Backend lead/referral storage exists before production.
- Referral code format and reward rules are defined.

## Main User Flow

### Step 1 - Start From CTA Or Referral

User:

- Clicks a waitlist CTA or opens `/r/[code]`.

System:

- Shows pre-launch context and preserves referral code where available.

### Step 2 - Submit Interest

User:

- Provides contact details or confirms interest.

System:

- Validates required fields.
- Persists the waitlist record with optional referral attribution.
- Shows loading and prevents duplicate submission.

### Step 3 - Confirmation

User:

- Lands on `/waitlist/confirmed`.

System:

- Confirms signup and shows any eligible MyStreet+ referral/reward messaging.

## Alternate Flows

- Returning visitor submits the same email again.
- Invalid or expired referral code is used.
- Visitor opens `/app` without joining the waitlist.

## Edge Cases & Failure Scenarios

- Duplicate email should return a friendly already-registered state.
- Invalid referral code should not block signup.
- Backend timeout should allow retry without double-recording.
- Referral abuse should be rate-limited server-side.

## Success State

The backend stores a waitlist lead with source, optional referral code, and
confirmation state. The visitor sees a successful confirmation.

## Failure State

The visitor sees validation or retry messaging, and no partial duplicate lead is
created.

## Backend / API Notes

- Suggested resources: `waitlist_leads`, `referral_codes`, `referral_events`.
- Store lowercased email, consent timestamp, source route, and referral code.
- Use idempotency by email plus referral event deduplication.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `waitlist_started` | User opens signup surface | `source, referralCode` |
| `waitlist_submitted` | Signup succeeds | `source, referralCode` |
| `waitlist_failed` | Signup fails | `errorCode, source` |

## Security & Validation Considerations

- Validate email server-side.
- Rate-limit submissions by IP/email.
- Do not trust referral code reward eligibility from the client.
- Store consent state for communications.

## Technical Notes / Engineering Considerations

- Keep referral attribution out of visual-only page state; persist it server-side.
- Consider secure cookies or URL params for attribution across pages.
- Confirmation copy must stay aligned with current pricing model.

## QA Testing Recommendations

- Valid signup without referral.
- Valid signup with referral.
- Duplicate email.
- Invalid referral.
- Slow network and retry.
- Mobile form usability.

## Open Questions

- What fields are required for the waitlist: email only, name, neighborhood, or
  intended role?
- What exact MyStreet+ reward is attached to successful referrals?

