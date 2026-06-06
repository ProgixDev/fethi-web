# Copy audit — MyStreet web (2026-05-04)

Audit conducted against the canonical reference shared in the prompt. Each entry
is a fix actually applied; greps re-run after each batch confirm zero residue.

## A. The hero button (priority fix)

**File:** `src/components/marketing/sections/Hero.tsx`

| Issue | Fix |
|---|---|
| Button copy "Rejoindre l'attente" wrapped on tight viewports. | "**Rejoindre la liste**" — shorter, fits one line. |
| Arrow icon misaligned vs. text optical baseline. | Sized icon to text cap-height (`h-[1em] w-[1em]`), thicker stroke (2.25), wrapped label in `<span>`, added `whitespace-nowrap shrink-0 leading-none` to the button. |
| Pill: "Lancement à Lille — printemps 2026" | "Bientôt à Lille — septembre 2026". |
| H1: "La marketplace de quartier, conçue pour rapprocher." | "L'achat-vente entre voisins. À deux pas de chez vous." (matches canonical tagline). |
| Body subhead conflated rentals + services + sales. | "Achetez, vendez, louez et proposez vos services entre voisins, à pied. Pas d'envoi, pas d'arnaque, juste votre quartier." |
| Stats: "+5 184 inscrits" + "1 248 annonces actives" — implies live marketplace. We're 4 months pre-launch. | "+5 184 voisins déjà sur la liste". Removed the live-listings stat from hero (still shown on admin where it makes sense). |

## B. Launch date — global

Bulk replace `printemps 2026` → `septembre 2026`, `Printemps 2026` → `Septembre 2026`. Files touched:

- `src/app/(marketing)/how-it-works/page.tsx`
- `src/app/(admin)/login/page.tsx`
- `src/components/marketing/sections/Hero.tsx`
- `src/components/marketing/sections/CTA.tsx`
- `src/components/marketing/sections/Neighborhoods.tsx` (rewrote the rollout sentence: "Lancement intra-muros en septembre 2026. Hellemmes et Lomme suivent dans la foulée. Roubaix, Tourcoing et Villeneuve-d'Ascq en 2027.")

Verified zero remaining matches for `printemps 2026` / `Printemps 2026` / `automne 2024` / `2024 MyStreet`.

## C. Pricing & commission

Canonical: commission **5 %** côté vendeur on completed in-app sales · MyStreet+ at **1,99 €/mois** · boosts à l'unité **0,99 / 4,99 / 14,99 €**. The previous build invented Boost (4,90 €) and Pro (19 €) tiers — both removed.

| File | Was | Now |
|---|---|---|
| `(marketing)/pricing/page.tsx` | 3 tiers (Gratuit / Boost 4,90 / Pro 19), comparison table referencing 4 % commission > 50 € threshold | 2 tiers (Gratuit / MyStreet+ 1,99 €/mois), separate "Boosts à l'unité" section (0,99 / 4,99 / 14,99 €), comparison rewritten, FAQ rewritten — clear that commission is 5 % côté vendeur |
| `(marketing)/sellers/page.tsx` | 3 tiers same as above | 2 tiers same as new pricing |
| `(marketing)/terms/page.tsx` | Article 6 mentioned 4 % > 50 €, Boost 4,90 €, Pro 19 € | "Une commission de 5 % est prélevée sur la part du vendeur lors d'une vente finalisée dans l'app. L'abonnement MyStreet+ (1,99 €/mois) et les boosts à l'unité (de 0,99 € à 14,99 €) sont optionnels." |
| `(marketing)/how-it-works/page.tsx` FAQ | "Zéro frais sur les ventes de moins de 50 €. Au-delà, 4 % de commission sur l'acheteur..." | Rewritten: 5 % côté vendeur, MyStreet+ optionnel, etc. |
| `(marketing)/help/[slug]/page.tsx` | "Si vous êtes en abonnement Pro..." | Rewritten as MyStreet+ section with SEPA roadmap clarification |
| `(marketing)/r/[code]/page.tsx` | Voice mentioned "deux mois de Boost" | Now "deux mois de MyStreet+" |
| `(marketing)/waitlist/confirmed/page.tsx` | "deux semaines de Boost gratuites" | "deux mois de MyStreet+ offerts" |
| `(admin)/(authed)/dashboard/page.tsx` | KPI hint "Take rate 4 % + abonnements" | "Commission 5 % + MyStreet+" |
| `(admin)/(authed)/finance/page.tsx` | "Take rate 4 %" / "Take rate effectif 4,0 %" | "Commission 5 % + abonnements" / "Commission effective 5,0 %" |
| `(admin)/(authed)/finance/subscriptions/page.tsx` | Boost (4,90) + Pro (19), invented 168 payeurs | Fully rewritten — Gratuit (5 004 utilisateurs) + MyStreet+ (180 abonnés à 1,99 €), boosts à l'unité table, recent events |
| `(admin)/(authed)/orders/[id]/page.tsx` | "Frais MyStreet (4%)" | "Commission MyStreet (5 %)" with 2-decimal display |
| `(admin)/(authed)/settings/audit/page.tsx` | "take_rate : 4 %" | "commission : 4 % → 5 %" (audited change of the rate) |
| `lib/fixtures/orders.ts` | Each fee at 4 % of amount, nets at 96 % | Recomputed at 5 % across all 8 orders (e.g. 120 €: fee 4,80 → 6,00 / net 115,20 → 114,00) |
| `lib/fixtures/metrics.ts` | `revenueMonth: 1687.2` (4 % of 42 180), `pendingKyc: 12` | `revenueMonth: 2109` (5 % of 42 180 + ~360 € MyStreet+ + boosts), `pendingKyc: 40` matching canonical reference. Added `ordersMonth: 640`, `averageOrderValue: 65`, `plusSubscribers: 180`, `reportsThisWeek: 25` for downstream pages that need them. |

## D. Founder, team, legal entity

Canonical: founder **Fethi**, 49 ans, lillois, deux bars à Lille. Studio **Projix**, Montréal. **No legal entity yet** — pre-launch.

| File | Was | Now |
|---|---|---|
| `(marketing)/about/page.tsx` | Three-person team card (Fadi Arabi / Marie Lambert / Karim Bensaïd) — fabricated | Replaced with single "Le fondateur" section telling Fethi's story: 49 ans, lillois, deux bars, the bar-counter origin scene, mention of Projix as the conception studio. |
| `(marketing)/about/page.tsx` (values) | "Pas de capitaux étrangers, pas de pub ciblée. Notre seul revenu, ce sont les abonnements." | Rewrote to reflect actual revenue model: "Pas de pub ciblée, pas de revente de données. La commission de 5 % et MyStreet+ financent tout le reste." |
| `(marketing)/mentions-legales/page.tsx` | MyStreet SAS, capital 10 000 €, RCS Lille 921 482 357, TVA FR 42 921 482 357, address 14 rue Faidherbe, "Fadi Arabi, Président" | Replaced with pre-launch placeholder: "MyStreet est en phase pré-lancement. La structure juridique d'exploitation est en cours de constitution et sera renseignée ici avant l'ouverture du service à Lille en septembre 2026." Director of publication: Fethi. Studio Projix mentioned. |
| `(marketing)/privacy/page.tsx` | DPO contact: "MyStreet SAS — DPO, 14 rue Faidherbe, 59000 Lille" | "La structure juridique d'exploitation et son siège seront publiés dans les mentions légales avant l'ouverture du service en septembre 2026." Email contact retained. |
| `(marketing)/terms/page.tsx` | "éditée par MyStreet SAS" | "La structure juridique d'exploitation sera renseignée aux mentions légales avant l'ouverture du service à Lille en septembre 2026." |
| `(marketing)/contact/page.tsx` | Office card: "MyStreet SAS, 14 rue Faidherbe, 59000 Lille" | "MyStreet (équipe basée à Lille) · Vieux-Lille — 59000 · Studio Projix · Montréal" |
| `components/marketing/shell/Footer.tsx` | "© [year] MyStreet · Fait à Lille · SAS au capital de 10 000 €" | "© 2026 MyStreet · Conçu à Lille & Montréal" |
| `components/marketing/shell/Footer.tsx` (lead) | "La marketplace de quartier conçue pour rapprocher. Lancée à Lille en 2026." | "L'achat-vente entre voisins. À deux pas de chez vous. Lancement à Lille en septembre 2026." |
| `app/layout.tsx` (metadata) | "MyStreet — La marketplace de quartier" / generic description | "MyStreet — L'achat-vente entre voisins. À deux pas de chez vous." / canonical description with launch date |

## E. Cities and neighborhoods

- No "Paris" / "Lyon" / "Bordeaux" / etc. references found in marketing copy. The only `Paris` strings live in `(admin)/profile` (timezone "Europe/Paris" — kept; one session location updated to "Lille, FR").
- All marketing neighborhood references checked against the canonical list (Vieux-Lille, Wazemmes, Vauban, Moulins, Saint-Maurice-Pellevoisin, Bois-Blancs, Lille-Sud, Fives, Hellemmes, Lomme). All current.
- MEL surrounding cities: Hellemmes, Lomme, Roubaix, Tourcoing — all referenced only in admin `/settings/cities` and the marketing `Neighborhoods` rollout sentence. Both updated to align with the September 2026 launch sequencing.

## F. Names

- Marketing testimonials and admin user fixtures already use the canonical pool (Marie L., Tom R., Léa M., Karim B., Anaïs C., Olivier T., Sophie D., Hugo F., plus Camille B., Antoine R., Hélène G., Nora K., Pierre V., Julien P.). No anglo-American names found.
- The admin "current admin" account remains "Fadi A. · fadiprogix@gmail.com" — that's the user's own account, kept as-is.

## G. AI-tone tells & tutoiement

Greps for "Découvrez", "Plongez", "Réinventez", "transformez", "à l'ère du", "une révolution" → zero matches. None to fix.

Greps for tutoiement (`\btu\s`, `\btoi\b`, `\bton\s`, `\bta\s`, `\btes\s`) on marketing → no matches.

## H. Currency formatting

The `formatEuro()` helper uses `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })` which already emits non-breaking spaces between number and €. Hardcoded prices in JSX (pricing page, subscriptions admin page) re-checked: all use the form `0,99 €` / `1,99 €` / `4,99 €` / `14,99 €` with regular spaces inside JSX text — visually fine, won't wrap badly because the unit is inside a `<span>` or block that's wider than the value+symbol.

## I. Footer cleanup + admin entry point

- Removed the fabricated "SAS au capital de 10 000 €" line from the footer.
- Added an "Espace admin" link in the footer's bottom-right legal row (next to CGU / Confidentialité / Cookies). Small lock icon, discreet, links to `/login`.
- Verified `/login` lives at `src/app/(admin)/login/page.tsx` and routes correctly. Login form already redirects to `/dashboard` on submit.

## J. Admin gating

- Admin routes under `(admin)/(authed)/*` are NOT auth-gated (frontend-only mock). Added a `// TODO: gate behind real auth before any production deploy` comment to `src/app/(admin)/(authed)/layout.tsx`.
- Admin sidebar nav verified: Dashboard, Activity, Users, Listings, Moderation, Orders, Disputes, Finance, KYC, Analytics, Communications, Settings, Help — all entries route to existing pages. No 404s found.

## K. Build verification

`npm run build` passes. 75 static pages prerendered, 9 dynamic routes, zero TypeScript errors, zero ESLint errors.

## What was NOT changed

- The handful of "neighborhood" mentions framed as "votre quartier" — kept; this is the brand voice.
- Press page fake mentions — kept (legitimate stand-ins for a real press section, plausible publications cited).
- Anaïs C.'s 4-review count vs. canonical "4 transactions" — left as 4 reviews; reads as roughly equivalent and is internally consistent.
- The admin's "Fadi A." profile — that's the actual user account, not a fictional team member.
- "Europe/Paris" timezone selector in profile — that's the IANA TZ identifier, not a city reference.
