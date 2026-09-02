-- SCR-029 (part 2) — enforce the pre-publish moderation gate at the database
-- level, not just in the admin UI.
--
-- `listings_update_own` RLS (SCR-001) lets an owner UPDATE any column on
-- their own listing, `status` included, with no restriction on the value —
-- and `listingsApi.update()` in fethi-mobile already passes `status` through
-- unchanged. Without this trigger, an owner could call that same client API
-- directly to set `status: 'ACTIVE'` on their own DRAFT/PENDING_REVIEW
-- listing, publishing it themselves and completely bypassing staff approval
-- — the RLS layer alone does not enforce the gate this SCR exists to add.
--
-- Scoped to UPDATE only (`before update of status`): a first-time INSERT
-- setting status straight to ACTIVE is untouched by this migration, since
-- fethi-mobile's `sell/review.tsx` still does exactly that today and hasn't
-- shipped its follow-up switch to PENDING_REVIEW yet (see
-- docs/MOBILE-SYNC-NOTES.md) — blocking INSERT here would break current
-- production listing creation. Verified no live caller currently updates
-- `listings.status` via the client at all (fethi-mobile has exactly one
-- `listingsApi.update()` call site, and it never touches `status`), so this
-- is a zero-behavior-change closure of a latent hole, not a live regression.
--
-- `auth.role()` (Supabase's standard JWT-role helper) distinguishes the
-- admin service-role write path (route handlers use the service-role key,
-- which bypasses this check) from a normal authenticated user's own
-- request — the same distinction PostgREST already uses for RLS itself.
create or replace function public.guard_listing_status_transition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'ACTIVE'
     and old.status in ('DRAFT', 'PENDING_REVIEW')
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception
      'LISTING_NOT_APPROVED: only staff can publish a listing out of % — approve it from the admin moderation queue',
      old.status
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.guard_listing_status_transition() from public, anon, authenticated;

create trigger listings_guard_status_transition
  before update of status on public.listings
  for each row execute function public.guard_listing_status_transition();
