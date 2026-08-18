-- Issue #21 — durable listing-publication confirmations.
--
-- A seller receives one in-app notification when an announcement becomes
-- ACTIVE. The ledger makes that side effect exactly-once per listing, including
-- if the client retries a request whose first response was lost.

-- A stable request id lets the mobile client safely look up an announcement
-- after a timeout instead of creating a second one on retry.
alter table public.listings
  add column publication_request_id uuid;

create unique index listings_owner_publication_request_id_key
  on public.listings (owner_id, publication_request_id)
  where publication_request_id is not null;

-- Photo-sync can be replayed after a client timeout without duplicating a
-- listing image. Existing callers already identify an image by storage path.
create unique index listing_photos_listing_storage_path_key
  on public.listing_photos (listing_id, storage_path);

-- Keep an auditable, one-to-one record of the publication side effect. The FK
-- is deferred because the trigger allocates the notification id before it
-- inserts the notification row in the same transaction.
create table public.listing_publication_notifications (
  listing_id       uuid primary key references public.listings (id) on delete cascade,
  notification_id  uuid not null references public.notifications (id)
                    on delete cascade deferrable initially deferred,
  created_at       timestamptz not null default now()
);

alter table public.listing_publication_notifications enable row level security;

create or replace function public.notify_listing_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Inserted drafts are not published yet. An ACTIVE listing only produces a
  -- notification on its initial publication, not on later ACTIVE updates.
  if new.status <> 'ACTIVE'
     or (tg_op = 'UPDATE' and old.status = 'ACTIVE') then
    return new;
  end if;

  -- The CTE is empty after a conflict, so the notification insert is skipped.
  -- This keeps the listing and its notification deduplicated atomically.
  with publication as (
    insert into public.listing_publication_notifications (listing_id, notification_id)
    values (new.id, gen_random_uuid())
    on conflict (listing_id) do nothing
    returning notification_id
  )
  insert into public.notifications (id, user_id, kind, title, body, href)
  select
    publication.notification_id,
    new.owner_id,
    'SYSTEM'::public.notif_kind,
    'Ton annonce est en ligne !',
    format('«%s» est maintenant visible dans ton quartier.', new.title),
    format('/listing/%s', new.id)
  from publication;

  return new;
end;
$$;

-- This is a trigger implementation detail, never a callable public API.
revoke all on function public.notify_listing_published() from public, anon, authenticated;

create trigger listings_notify_published
  after insert or update of status on public.listings
  for each row execute function public.notify_listing_published();
