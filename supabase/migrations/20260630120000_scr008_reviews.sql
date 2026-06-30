-- SCR-008 — Order-gated reviews + account-deletion tombstone.
-- Additive, forward-only. See docs/db/decisions/SCR-008.md.
--
-- Trust-&-safety backend, part 2. `reports` + `blocked_users` already shipped in
-- SCR-005 (and SCR-007 added the report rate-limit); this SCR adds the last
-- trust-&-safety table — `reviews` — plus a `profiles.deleted_at` tombstone used
-- by the account-delete Edge Function. Backs fethi-mobile TASK-013 (reviews) and
-- TASK-014 (account deletion). The account-delete / account-export / kyc-status
-- Edge Functions ship in supabase/functions/ in the same PR (deploy pending —
-- the CLI needs Docker, unavailable here; same as SCR-005's functions).

-- ===========================================================================
-- profiles.deleted_at — account-deletion tombstone.
-- Set (service role) by the account-delete Edge Function when a user deletes
-- their account: PII is anonymised, listings archived, the auth user banned, and
-- this column stamped. Nullable + additive → existing rows stay NULL (= live).
-- The row is KEPT (not hard-deleted) because orders.buyer_id/seller_id are
-- ON DELETE RESTRICT and historical orders must still resolve a counterparty.
-- ===========================================================================
alter table public.profiles
  add column if not exists deleted_at timestamptz;

-- ===========================================================================
-- reviews  (mobile ReviewResponse: id, orderId, authorId, targetUserId, rating,
--           comment, createdAt) — order-gated public reputation.
-- One review per (author, order, target). Only the buyer or seller of a
-- COMPLETED order may review their counterparty (enforced in the INSERT policy).
-- Public read (reputation is public per product policy). Immutable from clients
-- (no UPDATE/DELETE policy); moderation removal is service-role only.
-- ===========================================================================
create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id)   on delete cascade,
  author_id       uuid not null references public.profiles (id) on delete cascade,
  target_user_id  uuid not null references public.profiles (id) on delete cascade,
  rating          smallint not null check (rating between 1 and 5),
  comment         text     check (comment is null or char_length(comment) <= 2000),
  created_at      timestamptz not null default now(),
  -- one review per author, per order, per target (mobile spec: "unique per
  -- author/order/target")
  constraint reviews_unique_author_order_target unique (author_id, order_id, target_user_id),
  constraint reviews_author_not_target check (author_id <> target_user_id)
);

-- public profile page: "reviews received by this user", newest first
create index reviews_target_created_idx on public.reviews (target_user_id, created_at desc);
-- "have I already reviewed this order?" + order detail lookups
create index reviews_order_idx on public.reviews (order_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.reviews enable row level security;

-- ---- reviews SELECT: public reputation (anon + authenticated read all).
create policy reviews_select_public on public.reviews
  for select to anon, authenticated
  using (true);

-- ---- reviews INSERT: only the buyer/seller of a COMPLETED order, reviewing the
-- OTHER party of that same order. The EXISTS gate enforces order-gating +
-- membership + correct counterparty in a single predicate; author must be the
-- caller. `(select auth.uid())` is wrapped per the project RLS-perf convention.
create policy reviews_insert_participant on public.reviews
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and author_id <> target_user_id
    and exists (
      select 1
        from public.orders o
       where o.id = order_id
         and o.status = 'COMPLETED'
         and (
              (o.buyer_id  = (select auth.uid()) and o.seller_id = target_user_id)
           or (o.seller_id = (select auth.uid()) and o.buyer_id  = target_user_id)
         )
    )
  );
-- No UPDATE / DELETE policy → clients cannot edit or remove a review. Moderation
-- (service role) bypasses RLS to retract an abusive review if needed.

-- ===========================================================================
-- Aggregate maintenance: keep profiles.rating (avg) + reviews_count in sync with
-- the reviews a user has RECEIVED. SECURITY DEFINER so the trigger can update the
-- target's profile row (a reviewer holds no UPDATE grant on another user's
-- profile); search_path pinned (matches SCR-007's trigger). Recomputes from
-- scratch for the affected target(s) — correct under INSERT, and under any
-- service-role DELETE/UPDATE (e.g. moderation retraction).
-- ===========================================================================
create or replace function public.recompute_profile_review_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target uuid;
begin
  v_target := coalesce(new.target_user_id, old.target_user_id);

  update public.profiles p
     set reviews_count = agg.cnt,
         rating        = agg.avg_rating
    from (
      select count(*)::int                        as cnt,
             round(avg(rating)::numeric, 2)        as avg_rating
        from public.reviews
       where target_user_id = v_target
    ) agg
   where p.id = v_target;

  -- A review moving to a different target shouldn't happen (no client UPDATE),
  -- but if a service-role UPDATE ever does it, recompute the old target too.
  if (tg_op = 'UPDATE' and new.target_user_id is distinct from old.target_user_id) then
    update public.profiles p
       set reviews_count = agg.cnt,
           rating        = agg.avg_rating
      from (
        select count(*)::int                 as cnt,
               round(avg(rating)::numeric, 2) as avg_rating
          from public.reviews
         where target_user_id = old.target_user_id
      ) agg
     where p.id = old.target_user_id;
  end if;

  return null; -- AFTER trigger: return value ignored
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on every new function, which would make this
-- SECURITY DEFINER function a callable endpoint for anon/authenticated (Supabase
-- security advisor: anon_security_definer_function_executable). It's only ever
-- meant to run as a trigger, so lock direct execution down. Triggers still fire
-- (trigger dispatch doesn't require the invoker to hold EXECUTE).
revoke execute on function public.recompute_profile_review_stats() from public, anon, authenticated;

create trigger reviews_maintain_profile_stats
  after insert or update or delete on public.reviews
  for each row execute function public.recompute_profile_review_stats();
