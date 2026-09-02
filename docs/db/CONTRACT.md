# Shared Database Contract

This document summarizes the human-readable contract shared by `fethi-web` and
`fethi-mobile`. Generated database types remain the enforceable shape; accepted
SCRs in `docs/db/decisions/` are the change history.

## Listings

- `listing_type` is `VENTE`, `LOCATION`, or `SERVICE`.
- Since SCR-029: `listing_status` gained `PENDING_REVIEW`, inserted between
  `DRAFT` and `ACTIVE`. A newly-submitted listing lands in `PENDING_REVIEW`
  and stays invisible to the public (existing RLS already restricts public
  reads to `status = 'ACTIVE'`) until a staff member approves it (→ `ACTIVE`)
  or rejects it (→ `ARCHIVED`) from the admin moderation queue. Editing an
  already-`ACTIVE` listing, and owner pause/unpause, do **not** re-enter
  `PENDING_REVIEW` — only first-time creation is gated. As of this SCR
  landing, mobile has not yet switched its create-listing default from
  `ACTIVE` to `PENDING_REVIEW`, so the gate is dormant in production until
  that follow-up mobile change ships (see "Mobile must" below).
- Outside `DRAFT`, VENTE requires `price_cents` and SERVICE requires either
  `hourly_rate_cents` or `flat_rate_cents`.
- Since SCR-027, LOCATION is a contact-only classified ad and requires no
  structured price. `price_per_day_cents`, `price_per_week_cents`, and
  `deposit_cents` remain nullable legacy fields for backward compatibility.
- Existing listing RLS remains authoritative: owners write their own listings;
  public consumers read only publicly available listings under current policy.

## Rental interaction

- New LOCATION listings are photos/text plus messaging only.
- MyStreet does not create a rental reservation, availability schedule,
  deposit, checkout, or payment.
- New offers cannot be created or accepted for LOCATION; contact happens only
  through the listing's Messages thread.
- `orders-price-quote` and `orders-create` reject LOCATION with HTTP 409 and
  `RENTAL_CONTACT_ONLY`.
- Historical rental orders and their snapshots remain readable; SCR-027 does
  not delete or rewrite them.

## Support inbox

- Since SCR-028: `support_tickets` (one per user-opened request,
  `status`: `OPEN`/`IN_PROGRESS`/`RESOLVED`/`CLOSED`) and append-only
  `support_ticket_messages` (`sender_role`: `USER`/`STAFF`).
- A user reads/writes only their own tickets and messages on them; staff with
  the `support` or `admin` role reads/writes all.
- Users can only `insert` tickets and messages, never update a ticket row
  directly — replying via `support_ticket_messages` updates the parent
  ticket's `last_message*`/unread counters/`status` through a trigger.
- A user reply on a `RESOLVED`/`CLOSED` ticket reopens it to `OPEN`.
- Both tables are on the `supabase_realtime` publication.
