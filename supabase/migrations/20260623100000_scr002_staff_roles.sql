-- SCR-002 — Staff roles (admin RBAC). Additive, forward-only.
-- See docs/db/decisions/SCR-002.md. Web-admin only; mobile has no action.

create type public.staff_role as enum ('admin', 'moderator', 'finance', 'support');

create table public.staff_members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  roles      public.staff_role[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger staff_members_touch_updated_at
  before update on public.staff_members
  for each row execute function public.touch_updated_at();

-- RLS: read own row only; all writes service-role (no write policy).
alter table public.staff_members enable row level security;

create policy staff_members_select_own on public.staff_members
  for select to authenticated using ((select auth.uid()) = user_id);

-- SECURITY DEFINER helpers so admin RLS on later tables can gate on staff role
-- without granting visibility into staff_members itself.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff_members where user_id = uid);
$$;

create or replace function public.has_staff_role(uid uuid, role public.staff_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_members
    where user_id = uid and role = any (roles)
  );
$$;
