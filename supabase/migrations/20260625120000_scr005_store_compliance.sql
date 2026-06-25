-- SCR-005 — Store-compliance backend: blocked_users + reports.
-- Additive, forward-only. See docs/db/decisions/SCR-005.md.
-- Backs fethi-mobile TASK-014 (block/report) + coordinates with TASK-013 (reports).
-- Account deletion/export run in Edge Functions (supabase/functions/account-*),
-- authored separately; deploy pending (CLI needs Docker, unavailable here).

-- ===========================================================================
-- blocked_users  (owner-scoped UGC blocking — mobile blockedApi / BlockedUser)
-- You only ever see / create / remove YOUR OWN block rows.
-- ===========================================================================
create table public.blocked_users (
  id          uuid primary key default gen_random_uuid(),
  blocker_id  uuid not null references public.profiles (id) on delete cascade,
  blocked_id  uuid not null references public.profiles (id) on delete cascade,
  reason      text,
  created_at  timestamptz not null default now(),
  constraint blocked_users_unique unique (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

create index blocked_users_blocker_idx on public.blocked_users (blocker_id);

-- ===========================================================================
-- reports  (UGC reporting — mobile reportsApi / ReportResponse; TASK-013)
-- target_type / status kept as checked text (matches the shipped mobile
-- contract; additive — new values need only a CHECK change, no enum migration).
-- ===========================================================================
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  target_type  text not null check (target_type in ('LISTING', 'USER', 'THREAD', 'MESSAGE')),
  target_id    uuid not null,
  reason       text not null,
  details      text,
  status       text not null default 'OPEN'
                 check (status in ('OPEN', 'REVIEWING', 'ACTIONED', 'DISMISSED')),
  created_at   timestamptz not null default now()
);

-- rate-limit lookups (reporter, recent) + moderation lookups (target)
create index reports_reporter_created_idx on public.reports (reporter_id, created_at desc);
create index reports_target_idx           on public.reports (target_type, target_id);

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.blocked_users enable row level security;
alter table public.reports       enable row level security;

-- ---- blocked_users: strictly owner-scoped (blocker = me). No UPDATE.
create policy blocked_users_select_own on public.blocked_users
  for select to authenticated
  using ((select auth.uid()) = blocker_id);
create policy blocked_users_insert_own on public.blocked_users
  for insert to authenticated
  with check ((select auth.uid()) = blocker_id and blocker_id <> blocked_id);
create policy blocked_users_delete_own on public.blocked_users
  for delete to authenticated
  using ((select auth.uid()) = blocker_id);

-- ---- reports: a user files a report as themselves; NO client SELECT
-- (moderation is staff-only via the service role / admin app). Rate-limiting is
-- enforced in the report Edge Function (surfaces RATE_LIMITED) — the
-- reporter+created_at index above backs that check.
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));
