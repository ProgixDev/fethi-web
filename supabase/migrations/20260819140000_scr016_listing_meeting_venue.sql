-- Issue #23 — persist the seller-entered public handoff venue.
--
-- The mobile sell flow already requires a venue name (e.g. "Café X,
-- République") when the seller picks "Lieu public" as the handoff method,
-- and gates sending it on that choice — `meetingVenue` is only ever
-- non-null in the request when the seller selected the public-meetup
-- option. `listings` has no column to hold it yet, so the value is
-- silently dropped before the client's `listingReqToColumns` insert. This
-- adds just that column; see SCR-016 for the scope discussion (why
-- `pickup_method` itself is deliberately NOT added here).

alter table public.listings
  add column meeting_venue text;

comment on column public.listings.meeting_venue is
  'Seller-entered public meetup spot (e.g. "Café X, République"), set only '
  'when the seller chose a public handoff in the mobile sell flow (issue #23). '
  'Nullable — most listings (home pickup / shipping) leave this null.';
