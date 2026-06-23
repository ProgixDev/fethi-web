-- SCR-004 — Staff audit log (moderation/admin actions).
-- Additive, forward-only. Records every staff write action (user suspend/ban/
-- reactivate in WEB-009; listing pause/archive/restore in WEB-010) so moderation
-- is auditable. Service-role only: RLS is enabled with NO anon/authenticated
-- policy, so the table is invisible to the browser; the admin Route Handlers
-- (service-role client, gated by requireStaff + hasRole) write and read it.

create table if not exists public.staff_audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid not null references auth.users (id) on delete restrict,
  action      text not null,
  target_type text not null,
  target_id   uuid not null,
  before      jsonb,
  after       jsonb,
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists staff_audit_log_target_idx
  on public.staff_audit_log (target_type, target_id);

create index if not exists staff_audit_log_created_at_idx
  on public.staff_audit_log (created_at desc);

-- RLS on, but NO policy → invisible to anon + authenticated. Only the
-- service-role client (which bypasses RLS) inside admin Route Handlers may
-- read/write. Mobile never touches this table.
alter table public.staff_audit_log enable row level security;

comment on table public.staff_audit_log is
  'SCR-004: audit trail for staff moderation/admin actions. Service-role only (RLS enabled, no policy). Written by admin Route Handlers.';

-- Supporting indexes for the admin list/sort paths (WEB-009/WEB-010). The admin
-- screens filter `profiles`/`listings` by status/kyc/neighborhood and sort by
-- created_at desc via the service-role client (which bypasses RLS but still
-- benefits from indexes). Additive, no contract/type impact.
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_kyc_status_idx on public.profiles (kyc_status);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);
create index if not exists listings_status_created_idx on public.listings (status, created_at desc);
create index if not exists listings_created_at_idx on public.listings (created_at desc);
