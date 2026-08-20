-- SCR-018 — public.rate_limit_hits
--
-- Generic per-user, per-scope, fixed-window rate-limit counter. First
-- consumer: the `listing-category-suggest` Edge Function (mobile issue #25),
-- capped at 5 calls/user/day. Deliberately scope-agnostic so a future
-- Edge Function can reuse the same table with its own `scope` string instead
-- of growing a new table per feature.
--
-- Service-role only: no client (anon/authenticated) policy is added, matching
-- `idempotency_keys` (SCR-003) — Edge Functions read/write this via the
-- service-role client, never exposed to PostgREST for direct client access.
create table public.rate_limit_hits (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  scope        text not null,             -- e.g. 'listing-category-suggest'
  window_start timestamptz not null,      -- start of the fixed window (day-truncated UTC)
  hit_count    integer not null default 0,
  primary key (user_id, scope, window_start)
);

create index rate_limit_hits_window_idx on public.rate_limit_hits (window_start);

alter table public.rate_limit_hits enable row level security;
-- No policies: default-deny for anon/authenticated. Service-role bypasses RLS.

-- Atomic increment-and-read, so a concurrent double-call from the same user
-- can't race past the limit (a plain select-then-upsert from the Edge
-- Function would have a check-then-act gap). SECURITY DEFINER so it can run
-- as the table owner regardless of caller role; only ever invoked by
-- Edge Functions via the service-role client, never exposed to anon/authenticated
-- (no RLS policy grants them execute-relevant table access anyway, and the
-- function itself does not check auth.uid() — callers must be trusted, i.e.
-- service-role only).
create function public.increment_rate_limit_hit(
  p_user_id uuid,
  p_scope text,
  p_window_start timestamptz
) returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limit_hits (user_id, scope, window_start, hit_count)
  values (p_user_id, p_scope, p_window_start, 1)
  on conflict (user_id, scope, window_start)
  do update set hit_count = rate_limit_hits.hit_count + 1
  returning hit_count;
$$;

revoke all on function public.increment_rate_limit_hit(uuid, text, timestamptz) from public, anon, authenticated;
