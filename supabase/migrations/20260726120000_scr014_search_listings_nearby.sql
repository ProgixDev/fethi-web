-- SCR-014 — search_listings_nearby: PostGIS proximity search RPC
--
-- SCR-001 created listings.location (generated geography(Point,4326)) + the GiST
-- index listings_location_gix, but nothing ever used them: radius search was a
-- lat/lng bounding box filtered to the exact circle IN THE CLIENT, AFTER
-- pagination — producing wrong counts, broken paging, and per-page-only distance
-- order (mobile TASK-022). This RPC does the geo filter + distance ordering in
-- Postgres against the index.
--
-- Returns `setof public.listings` so PostgREST can still embed listing_photos /
-- owner / category via the client's existing LISTING_SELECT. All filters live in
-- the function so the client adds ONLY .select()/.range() — no outer WHERE/ORDER,
-- which keeps the function's distance ORDER BY intact through pagination.
--
-- security invoker: existing RLS on `listings` applies unchanged (anon sees only
-- ACTIVE rows; owners see their own). Exposes exactly the columns a direct table
-- select already returns today — no new coordinate leak.

create or replace function public.search_listings_nearby(
  p_lat              double precision,
  p_lng              double precision,
  p_radius_m         double precision,
  p_status           public.listing_status    default 'ACTIVE',
  p_listing_type     public.listing_type      default null,
  p_category_id      uuid                      default null,
  p_condition        public.listing_condition  default null,
  p_neighborhood     text                      default null,
  p_owner_id         uuid                      default null,
  p_min_price_cents  integer                   default null,
  p_max_price_cents  integer                   default null,
  p_q                text                      default null
)
returns setof public.listings
language sql
stable
security invoker
set search_path = public
as $$
  select l.*
  from public.listings l
  where l.location is not null
    and st_dwithin(
      l.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_m
    )
    and l.status = p_status
    and (p_listing_type    is null or l.listing_type = p_listing_type)
    and (p_category_id     is null or l.category_id  = p_category_id)
    and (p_condition       is null or l.condition    = p_condition)
    and (p_neighborhood    is null or l.neighborhood = p_neighborhood)
    and (p_owner_id        is null or l.owner_id     = p_owner_id)
    and (p_min_price_cents is null or (l.price_cents is not null and l.price_cents >= p_min_price_cents))
    and (p_max_price_cents is null or (l.price_cents is not null and l.price_cents <= p_max_price_cents))
    and (
      p_q is null
      or l.title       ilike '%' || p_q || '%'
      or l.description  ilike '%' || p_q || '%'
    )
  order by l.location <-> st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography;
$$;

grant execute on function public.search_listings_nearby(
  double precision, double precision, double precision,
  public.listing_status, public.listing_type, uuid, public.listing_condition,
  text, uuid, integer, integer, text
) to anon, authenticated;
