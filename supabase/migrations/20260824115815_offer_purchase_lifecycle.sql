-- Issue #37 — accepting an offer reserves the VENTE listing atomically.
-- This function is service-role-only; offers-respond authenticates the seller
-- before calling it.  A database transaction prevents two accepted offers.
create unique index offers_one_accepted_per_listing
  on public.offers (listing_id)
  where status = 'ACCEPTED';

create or replace function public.accept_offer(
  p_offer_id uuid,
  p_seller_id uuid,
  p_message text default null
)
returns public.offers
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_offer public.offers;
  v_listing_status public.listing_status;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'offer_not_found'; end if;
  if v_offer.seller_id <> p_seller_id then raise exception 'only_seller_can_respond'; end if;
  if v_offer.status <> 'PENDING' then raise exception 'offer_not_pending:%', v_offer.status; end if;
  if v_offer.expires_at <= now() then
    update public.offers set status = 'EXPIRED', responded_at = now()
      where id = p_offer_id and status = 'PENDING';
    raise exception 'offer_expired';
  end if;

  select status into v_listing_status from public.listings where id = v_offer.listing_id for update;
  if not found then raise exception 'listing_not_found'; end if;
  if v_listing_status <> 'ACTIVE' then raise exception 'listing_not_available'; end if;

  update public.listings set status = 'SOLD' where id = v_offer.listing_id and status = 'ACTIVE';
  update public.offers
    set status = 'ACCEPTED', response_message = p_message, responded_at = now()
    where id = p_offer_id
    returning * into v_offer;
  update public.offers
    set status = 'REJECTED', response_message = 'Annonce réservée pour une autre offre.', responded_at = now()
    where listing_id = v_offer.listing_id and id <> p_offer_id and status = 'PENDING';
  return v_offer;
end;
$$;

revoke all on function public.accept_offer(uuid, uuid, text) from public;
grant execute on function public.accept_offer(uuid, uuid, text) to service_role;
