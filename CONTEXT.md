# MyStreet

Hyper-local marketplace where neighbours buy, rent, and hire services from each
other. `fethi-web` (admin + marketing) owns the shared database; `fethi-mobile`
(consumer app) consumes it. This glossary is the canonical domain language both
apps speak — keep it free of implementation detail.

## Language

**Listing**:
A single thing a member offers to neighbours — an item for sale, an item to rent,
or a service to hire.
_Avoid_: ad, post, item, annonce (use "Listing" in code/English; "annonce" is the
French UI label only).

**Listing Type**:
Which of the three marketplace modes a **Listing** is. Exactly one of:
- **VENTE** — an item sold outright for a single price.
- **LOCATION** — an item rented for a period (day/week) against a deposit.
- **SERVICE** — labour/skill hired by the hour or at a flat rate, offered within a
  travel radius.
_Avoid_: sale/rental/service (English was used in early planning docs; the shipped
canonical values are the French uppercase tokens above).

**Member**:
A person with a MyStreet account (one `auth.users` identity). Acts as both buyer
and seller depending on context.
_Avoid_: user, account, customer (when precision matters, say **Member**).

**Public Profile**:
The neighbour-visible projection of a **Member** — display name, avatar, bio, age,
profession, and approximate location (**Neighbourhood** + city). Excludes exact
coordinates, contact details, and KYC state.
_Avoid_: profile (unqualified — say **Public Profile** vs the owner's private profile).

**Neighbourhood**:
The coarse, publicly-shown location unit for a **Member** or **Listing**. Exact
latitude/longitude are private; the **Neighbourhood** (and city) are what others see.

**KYC**:
A **Member's** identity-verification state (UNVERIFIED / PENDING / VERIFIED /
REJECTED) plus tier. Private; never part of the **Public Profile**.
_Avoid_: verification, identity check (use **KYC**).

**Listing Status**:
A **Listing's** lifecycle state: DRAFT (incomplete, owner-only) → ACTIVE
(published, publicly visible) → PAUSED / SOLD / ARCHIVED (hidden from public,
owner-only). Only ACTIVE listings appear in neighbours' feeds.

**Favorite**:
A **Member** bookmarking a **Listing**. Member-owned; drives the listing's
favourite count.

**Saved Search**:
A **Member's** stored search criteria (query, type, category, price, centre +
radius) that can later raise alerts on matching new **Listings**.
_Avoid_: alert, watch (the saved criteria is the **Saved Search**; the
notification it may raise is a separate concept).

## Relationships

- A **Member** owns zero or more **Listings**.
- Every **Listing** has exactly one **Listing Type** and an optional **Category**.
- A **Member** has zero or more **Favorites** and **Saved Searches**.
- A **Category** belongs to one **Listing Type** and may have a parent **Category**.

## Example dialogue

> **Dev:** "Is a LOCATION **Listing** priced the same way as a VENTE one?"
> **Domain expert:** "No — VENTE has one sale price; LOCATION has a per-day and
> per-week price plus a deposit; SERVICE has an hourly or flat rate and a travel
> radius. Same entity, type-specific pricing."

## Flagged ambiguities

- "sale/rental/service" (English, from early planning docs) vs
  "VENTE/LOCATION/SERVICE" (shipped mobile code) — **resolved**: the French
  uppercase tokens are canonical; the contract must match shipped code.
