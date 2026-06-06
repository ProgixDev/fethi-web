## Feature Information

- Feature Name: Public Marketing Site
- Description / Goal: Explain MyStreet's Lille neighborhood marketplace promise
  and convert visitors toward launch interest.
- Screens Involved: `/`, `/how-it-works`, `/buyers`, `/sellers`, `/services`,
  `/rentals`, `/pricing`, `/about`, `/safety`, `/community-guidelines`,
  `/help`, `/blog`, `/contact`, legal pages.
- User Inputs: Navigation clicks, waitlist CTA clicks, contact/help discovery,
  cookie consent.
- Backend/API Interactions: None required for static content; future CMS/content
  source for blog/help/careers.
- Special Conditions / Rules: Copy must preserve September 2026 Lille launch,
  5 percent seller-side commission, MyStreet+ pricing, and no fabricated legal
  entity.
- Additional Notes: Marketing surfaces use Lenis smooth scroll and should later
  receive real Lille photography.

---

# Public Marketing Site

## Purpose

The public marketing site explains what MyStreet is, why it is local to Lille,
how neighborhood buying/selling/renting/services work, and why visitors can
trust the pre-launch product.

## Entry Points

- Direct visit to `/`
- Search/social/direct links to marketing subpages
- Footer links
- Referral route forwarding users into the public product story

## Preconditions

- App is reachable.
- Static page content is available.
- Cookie banner can use `localStorage` in the browser.

## Main User Flow

### Step 1 - Arrive On Homepage

User:

- Opens the homepage.

System:

- Shows the canonical tagline, launch context, main CTAs, and marketing sections.
- Uses the marketing shell, header, footer, and cookies banner.

### Step 2 - Explore Product Narrative

User:

- Opens how-it-works, buyers, sellers, services, rentals, or pricing.

System:

- Explains the marketplace loop and pricing rules with local Lille copy.
- Keeps navigation and footer consistent.

### Step 3 - Review Trust And Legal Context

User:

- Opens safety, community guidelines, privacy, terms, cookies, mentions legales,
  about, or contact.

System:

- Presents audited copy without fabricated company registration details.
- Keeps the pre-launch legal status explicit.

## Alternate Flows

- User reaches a dynamic blog/help/careers route directly.
- User dismisses or accepts cookies.
- User uses footer admin link to reach `/login`.

## Edge Cases & Failure Scenarios

- Missing CMS content should render a useful empty or fallback page, not a fake
  article.
- Browser blocks `localStorage`; cookie banner should fail harmlessly.
- Marketing image assets are missing; layout should remain readable.
- Wrong launch or pricing copy creates product/legal risk and should be caught by
  copy audit.

## Success State

The visitor understands MyStreet's local marketplace value, sees clear launch
and pricing facts, and can move to waitlist/referral/contact/admin entry points.

## Failure State

The visitor sees broken content, outdated claims, or generic placeholder copy.
The page should still render and expose contact/help routes.

## Backend / API Notes

- Static pages do not require backend calls.
- Blog/help/careers should eventually read from MDX, Supabase tables, or a CMS.
- Waitlist submission is documented separately.

## Analytics & Tracking Events

| Event name | Trigger | Key properties |
| --- | --- | --- |
| `marketing_page_viewed` | Marketing route loads | `path, referrer` |
| `marketing_cta_clicked` | User clicks a primary CTA | `path, ctaId` |
| `cookie_choice_saved` | User accepts or rejects cookies | `choice` |

## Security & Validation Considerations

- Do not expose admin-only data on public pages.
- Legal copy should remain accurate until the company entity is finalized.
- Cookie behavior must match the privacy/cookies pages.

## Technical Notes / Engineering Considerations

- Lenis is marketing-only and should not be mounted in admin.
- Brand tokens should stay in `tailwind.config.ts` and `src/lib/tokens.ts`.
- Replace gradient placeholders with real or generated images following
  `docs/brand/IMAGE_PROMPTS.md`.

## QA Testing Recommendations

- Verify every marketing nav/footer link resolves.
- Check mobile wrapping for hero CTA and pricing text.
- Verify no old pricing or launch-date strings return.
- Test cookie banner persistence and reduced-motion behavior.
- Check accessibility landmarks and heading order.

## Open Questions

- Which CMS/content source will own blog, help, and careers content?
- Will waitlist capture happen directly in Supabase or through a separate email
  tool?

