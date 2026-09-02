-- SCR-027: LOCATION listings are contact-only. Block new offer creation and
-- prevent any legacy pending rental offer from being accepted. Historical
-- offers remain readable and can still be rejected or withdrawn.
create or replace function public.enforce_contact_only_rental_offers()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if (tg_op = 'INSERT' or new.status = 'ACCEPTED') and exists (
    select 1
    from public.listings l
    where l.id = new.listing_id
      and l.listing_type = 'LOCATION'
  ) then
    raise exception 'RENTAL_CONTACT_ONLY' using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger offers_contact_only_rental_guard
  before insert or update of status on public.offers
  for each row execute function public.enforce_contact_only_rental_offers();
