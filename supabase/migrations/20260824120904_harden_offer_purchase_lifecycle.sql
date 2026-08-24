-- SCR-026 / issue #37 follow-up: harden offer reservation races and recovery.
alter table public.offers
  add column if not exists checkout_expires_at timestamptz;

create unique index if not exists orders_one_offer_idx
  on public.orders (offer_id) where offer_id is not null;
create unique index if not exists orders_one_open_sale_listing_idx
  on public.orders (listing_id)
  where listing_type = 'VENTE'
    and status in ('AWAITING_PICKUP', 'HANDOFF_PENDING')
    and created_at >= timestamptz '2026-08-24 13:00:00+00';

create or replace function public.expire_offer_reservation(p_listing_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  update public.offers
    set status = 'EXPIRED', response_message = 'Délai de paiement expiré.', responded_at = now()
    where listing_id = p_listing_id and status = 'ACCEPTED' and order_id is null
      and checkout_expires_at <= now();
  if not exists (select 1 from public.offers where listing_id = p_listing_id and status = 'ACCEPTED') then
    update public.listings set status = 'ACTIVE' where id = p_listing_id and status = 'SOLD';
  end if;
end;
$$;

create or replace function public.accept_offer(p_offer_id uuid, p_seller_id uuid, p_message text default null)
returns public.offers language plpgsql security invoker set search_path = public as $$
declare v_offer public.offers; v_listing public.listings;
begin
  select * into v_offer from public.offers where id = p_offer_id for update;
  if not found then raise exception 'offer_not_found'; end if;
  if v_offer.seller_id <> p_seller_id then raise exception 'only_seller_can_respond'; end if;
  if v_offer.status <> 'PENDING' then raise exception 'offer_not_pending:%', v_offer.status; end if;
  if v_offer.expires_at <= now() then
    update public.offers set status = 'EXPIRED', responded_at = now() where id = p_offer_id;
    raise exception 'offer_expired';
  end if;
  perform public.expire_offer_reservation(v_offer.listing_id);
  select * into v_listing from public.listings where id = v_offer.listing_id for update;
  if not found then raise exception 'listing_not_found'; end if;
  if v_listing.listing_type <> 'VENTE' then raise exception 'offers_unsupported_for_listing_type'; end if;
  if v_listing.status <> 'ACTIVE' then raise exception 'listing_not_available'; end if;
  update public.listings set status = 'SOLD' where id = v_listing.id;
  update public.offers set status = 'ACCEPTED', response_message = p_message,
    responded_at = now(), checkout_expires_at = now() + interval '30 minutes'
    where id = p_offer_id returning * into v_offer;
  update public.offers set status = 'REJECTED', response_message = 'Annonce réservée pour une autre offre.', responded_at = now()
    where listing_id = v_offer.listing_id and id <> p_offer_id and status = 'PENDING';
  return v_offer;
end;
$$;
