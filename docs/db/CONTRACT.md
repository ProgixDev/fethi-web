# Shared Database Contract

This document summarizes the human-readable contract shared by `fethi-web` and
`fethi-mobile`. Generated database types remain the enforceable shape; accepted
SCRs in `docs/db/decisions/` are the change history.

## Listings

- `listing_type` is `VENTE`, `LOCATION`, or `SERVICE`.
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
