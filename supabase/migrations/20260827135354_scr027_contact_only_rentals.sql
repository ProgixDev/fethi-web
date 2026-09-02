-- SCR-027: LOCATION is a contact-only classified ad. Existing rental columns
-- remain available for historical rows, but new active listings need no daily
-- rate because MyStreet no longer manages booking, dates, deposits, or payment.
alter table public.listings
  drop constraint listings_pricing_by_type;

alter table public.listings
  add constraint listings_pricing_by_type check (
    status = 'DRAFT' or (
      case listing_type
        when 'VENTE'    then price_cents is not null
        when 'LOCATION' then true
        when 'SERVICE'  then (hourly_rate_cents is not null or flat_rate_cents is not null)
      end
    )
  );
