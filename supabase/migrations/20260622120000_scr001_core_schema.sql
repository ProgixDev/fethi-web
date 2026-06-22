-- SCR-001 — Core marketplace schema (profiles, categories, listings,
-- listing_photos, favorites, saved_searches) + RLS + storage.
-- Additive, forward-only. See docs/db/decisions/SCR-001.md and ADR-0001 (PostGIS).

-- ===========================================================================
-- Extensions
-- ===========================================================================
create extension if not exists postgis;

-- ===========================================================================
-- Enums (values match shipped mobile api.ts — do not rename, only ADD VALUE)
-- ===========================================================================
create type public.listing_type as enum ('VENTE', 'LOCATION', 'SERVICE');
create type public.listing_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'SOLD', 'ARCHIVED');
create type public.user_status as enum ('ACTIVE', 'PENDING', 'SUSPENDED', 'BANNED');
create type public.kyc_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
create type public.listing_condition as enum ('new', 'likenew', 'good', 'fair');

-- ===========================================================================
-- Shared helpers
-- ===========================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- profiles  (1 row per auth.users identity)
-- ===========================================================================
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  display_name    text,
  avatar_path     text,
  bio             text,
  age             smallint check (age is null or (age >= 0 and age <= 130)),
  profession      text,
  -- private location
  address_label   text,
  lat             double precision,
  lng             double precision,
  location        geography(Point, 4326)
                    generated always as (
                      case when lat is not null and lng is not null
                        then st_setsrid(st_makepoint(lng, lat), 4326)::geography
                        else null end
                    ) stored,
  -- public (coarse) location
  neighborhood    text,
  city            text,
  -- account state
  status          public.user_status not null default 'PENDING',
  kyc_status      public.kyc_status  not null default 'UNVERIFIED',
  kyc_tier        smallint not null default 0,
  -- public counters (maintained by later SCRs / triggers)
  rating          numeric(3,2),
  reviews_count   integer not null default 0,
  listings_count  integer not null default 0,
  sales_count     integer not null default 0,
  gmv_cents       bigint  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- categories  (flat self-referencing tree, scoped by listing_type)
-- ===========================================================================
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  label       text not null,
  subtitle    text,
  parent_id   uuid references public.categories (id) on delete cascade,
  type        public.listing_type not null,
  glyph       text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (type, slug)
);

create index categories_type_parent_sort_idx
  on public.categories (type, parent_id, sort_order);

-- ===========================================================================
-- listings
-- ===========================================================================
create table public.listings (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references public.profiles (id) on delete cascade,
  listing_type          public.listing_type not null,
  title                 text not null,
  description           text,
  category_id           uuid references public.categories (id) on delete set null,
  condition             public.listing_condition,
  -- pricing (per type; sparse)
  price_cents           integer check (price_cents is null or price_cents >= 0),
  price_per_day_cents   integer check (price_per_day_cents is null or price_per_day_cents >= 0),
  price_per_week_cents  integer check (price_per_week_cents is null or price_per_week_cents >= 0),
  deposit_cents         integer check (deposit_cents is null or deposit_cents >= 0),
  hourly_rate_cents     integer check (hourly_rate_cents is null or hourly_rate_cents >= 0),
  flat_rate_cents       integer check (flat_rate_cents is null or flat_rate_cents >= 0),
  service_radius_km     integer check (service_radius_km is null or service_radius_km >= 0),
  -- location
  lat                   double precision,
  lng                   double precision,
  location              geography(Point, 4326)
                          generated always as (
                            case when lat is not null and lng is not null
                              then st_setsrid(st_makepoint(lng, lat), 4326)::geography
                              else null end
                          ) stored,
  neighborhood          text,
  status                public.listing_status not null default 'DRAFT',
  -- counters
  view_count            integer not null default 0,
  favorites_count       integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- per-type pricing required only once published (drafts may be incomplete)
  constraint listings_pricing_by_type check (
    status = 'DRAFT' or (
      case listing_type
        when 'VENTE'    then price_cents is not null
        when 'LOCATION' then price_per_day_cents is not null
        when 'SERVICE'  then (hourly_rate_cents is not null or flat_rate_cents is not null)
      end
    )
  )
);

create index listings_active_filter_idx
  on public.listings (status, listing_type, category_id)
  where status = 'ACTIVE';
create index listings_owner_status_idx on public.listings (owner_id, status);
create index listings_location_gix on public.listings using gist (location);

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- listing_photos
-- ===========================================================================
create table public.listing_photos (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

create index listing_photos_listing_idx
  on public.listing_photos (listing_id, sort_order);

-- ===========================================================================
-- favorites  (member bookmarks a listing; drives listings.favorites_count)
-- ===========================================================================
create table public.favorites (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  listing_id  uuid not null references public.listings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index favorites_listing_idx on public.favorites (listing_id);

create or replace function public.sync_favorites_count()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.listings set favorites_count = favorites_count + 1
      where id = new.listing_id;
  elsif (tg_op = 'DELETE') then
    update public.listings set favorites_count = greatest(favorites_count - 1, 0)
      where id = old.listing_id;
  end if;
  return null;
end;
$$;

create trigger favorites_count_sync
  after insert or delete on public.favorites
  for each row execute function public.sync_favorites_count();

-- ===========================================================================
-- saved_searches
-- ===========================================================================
create table public.saved_searches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  name            text not null,
  query           text,
  listing_type    public.listing_type,
  category_id     uuid references public.categories (id) on delete set null,
  condition       public.listing_condition,
  min_price_cents integer check (min_price_cents is null or min_price_cents >= 0),
  max_price_cents integer check (max_price_cents is null or max_price_cents >= 0),
  center_lat      double precision,
  center_lng      double precision,
  center          geography(Point, 4326)
                    generated always as (
                      case when center_lat is not null and center_lng is not null
                        then st_setsrid(st_makepoint(center_lng, center_lat), 4326)::geography
                        else null end
                    ) stored,
  radius_meters   integer check (radius_meters is null or radius_meters >= 0),
  alerts_enabled  boolean not null default false,
  created_at      timestamptz not null default now()
);

create index saved_searches_user_idx on public.saved_searches (user_id);
create index saved_searches_center_gix on public.saved_searches using gist (center);

-- ===========================================================================
-- public_profiles  (security-definer view: neighbour-safe columns only)
-- Intentionally NOT security_invoker so anon/authenticated can read the safe
-- subset of OTHER members without a public RLS policy on the base table
-- (which would expose exact coords + KYC). Supabase's security_definer_view
-- advisor will flag this — it is deliberate; only safe columns are selected.
-- ===========================================================================
create view public.public_profiles
with (security_invoker = false) as
select
  id, display_name, avatar_path, bio, age, profession,
  neighborhood, city, rating, reviews_count, listings_count, sales_count, created_at
from public.profiles;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles       enable row level security;
alter table public.categories      enable row level security;
alter table public.listings        enable row level security;
alter table public.listing_photos  enable row level security;
alter table public.favorites       enable row level security;
alter table public.saved_searches  enable row level security;

-- profiles: owner-only base access (public discovery goes through the view)
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- categories: public reference data; writes service-role only (no policy)
create policy categories_select_public on public.categories
  for select to anon, authenticated using (true);

-- listings: public ACTIVE read + owner full access
create policy listings_select_active on public.listings
  for select to anon, authenticated using (status = 'ACTIVE');
create policy listings_select_own on public.listings
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy listings_insert_own on public.listings
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy listings_update_own on public.listings
  for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy listings_delete_own on public.listings
  for delete to authenticated using ((select auth.uid()) = owner_id);

-- listing_photos: readable when parent is publicly readable or owned; owner writes
create policy listing_photos_select on public.listing_photos
  for select to anon, authenticated using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status = 'ACTIVE' or (select auth.uid()) = l.owner_id)
    )
  );
create policy listing_photos_write_owner on public.listing_photos
  for all to authenticated
  using (
    exists (select 1 from public.listings l
            where l.id = listing_id and (select auth.uid()) = l.owner_id)
  )
  with check (
    exists (select 1 from public.listings l
            where l.id = listing_id and (select auth.uid()) = l.owner_id)
  );

-- favorites + saved_searches: fully member-owned
create policy favorites_owner on public.favorites
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy saved_searches_owner on public.saved_searches
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ===========================================================================
-- Storage buckets + policies
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- public read of both buckets
create policy storage_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('listing-photos', 'avatars'));

-- writes scoped to the member's own top-level folder ({auth.uid()}/...)
create policy storage_owner_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('listing-photos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy storage_owner_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('listing-photos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy storage_owner_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('listing-photos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
