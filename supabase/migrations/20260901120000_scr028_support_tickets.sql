-- SCR-028 — Support inbox: support_tickets + support_ticket_messages.
-- See docs/db/decisions/SCR-028.md. Additive, forward-only.
-- Closes ProgixDev/fethi-mobile#77.

create type public.support_ticket_status as enum ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
create type public.support_sender_role as enum ('USER', 'STAFF');

-- ===========================================================================
-- support_tickets
-- ===========================================================================
create table public.support_tickets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  subject           text not null check (char_length(subject) between 1 and 200),
  status            public.support_ticket_status not null default 'OPEN',
  assigned_staff_id uuid references public.staff_members (user_id) on delete set null,
  last_message      text,
  last_message_at   timestamptz,
  last_sender_role  public.support_sender_role,
  unread_by_user    integer not null default 0,
  unread_by_staff   integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index support_tickets_user_idx   on public.support_tickets (user_id, updated_at desc);
create index support_tickets_queue_idx  on public.support_tickets (status, updated_at desc);

create trigger support_tickets_touch_updated_at
  before update on public.support_tickets
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- support_ticket_messages  (append-only)
-- ===========================================================================
create table public.support_ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  -- auth.users, NOT profiles: sender is USER or STAFF, and a staff account is
  -- not guaranteed to have a marketplace profile row (mirrors
  -- staff_audit_log.actor_id's FK, SCR-004).
  sender_id   uuid not null references auth.users (id) on delete cascade,
  sender_role public.support_sender_role not null,
  body        text not null check (char_length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create index support_ticket_messages_ticket_idx on public.support_ticket_messages (ticket_id, created_at);

-- ---------------------------------------------------------------------------
-- is_support_ticket_participant — SECURITY DEFINER so message RLS can gate on
-- ticket ownership/staff without a recursive read of support_tickets' own RLS.
-- Mirrors SCR-003's is_thread_participant.
-- ---------------------------------------------------------------------------
create or replace function public.is_support_ticket_participant(p_ticket_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.support_tickets t
    where t.id = p_ticket_id
      and (
        t.user_id = p_uid
        or public.has_staff_role(p_uid, 'support')
        or public.has_staff_role(p_uid, 'admin')
      )
  );
$$;

revoke execute on function public.is_support_ticket_participant(uuid, uuid) from public;
grant execute on function public.is_support_ticket_participant(uuid, uuid) to authenticated, service_role;

-- maintain support_tickets.last_message* + unread counters on each new message;
-- reopen a RESOLVED/CLOSED ticket when the user replies after staff closed it.
create or replace function public.sync_ticket_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.support_tickets
     set last_message     = new.body,
         last_message_at  = new.created_at,
         last_sender_role = new.sender_role,
         unread_by_user    = unread_by_user  + (case when new.sender_role = 'STAFF' then 1 else 0 end),
         unread_by_staff   = unread_by_staff + (case when new.sender_role = 'USER'  then 1 else 0 end),
         status = case
                     when new.sender_role = 'USER' and status in ('RESOLVED', 'CLOSED') then 'OPEN'
                     else status
                   end,
         updated_at = now()
   where id = new.ticket_id;

  return new;
end;
$$;

create trigger support_ticket_messages_sync
  after insert on public.support_ticket_messages
  for each row execute function public.sync_ticket_on_message();

-- ===========================================================================
-- RLS
-- ===========================================================================
alter table public.support_tickets enable row level security;
alter table public.support_ticket_messages enable row level security;

create policy support_tickets_select on public.support_tickets
  for select to authenticated using (
    user_id = (select auth.uid())
    or public.has_staff_role((select auth.uid()), 'support')
    or public.has_staff_role((select auth.uid()), 'admin')
  );

create policy support_tickets_insert_own on public.support_tickets
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy support_tickets_update_staff on public.support_tickets
  for update to authenticated using (
    public.has_staff_role((select auth.uid()), 'support')
    or public.has_staff_role((select auth.uid()), 'admin')
  );

create policy support_ticket_messages_select on public.support_ticket_messages
  for select to authenticated using (
    public.is_support_ticket_participant(ticket_id, (select auth.uid()))
  );

create policy support_ticket_messages_insert on public.support_ticket_messages
  for insert to authenticated with check (
    sender_id = (select auth.uid())
    and public.is_support_ticket_participant(ticket_id, (select auth.uid()))
  );

-- Mobile (support screen) and admin (support inbox) both listen live.
alter publication supabase_realtime add table public.support_tickets;
alter publication supabase_realtime add table public.support_ticket_messages;
