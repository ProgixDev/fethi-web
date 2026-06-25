-- SCR-006 — mark_thread_read RPC + private message-attachments bucket.
-- Additive, forward-only. See docs/db/decisions/SCR-006.md.
-- Closes two TASK-007 gaps left by SCR-003:
--   1. nothing reset a participant's OWN unread on read (threads = no client
--      UPDATE, increment-only trigger) → mark_thread_read RPC;
--   2. the `message-attachments` Storage bucket the mobile sendPhoto writes to
--      was never created → add it (private, participant-scoped).

-- ===========================================================================
-- mark_thread_read(p_thread_id) — zero the CALLER's own unread on a thread they
-- belong to. SECURITY DEFINER (bypasses the "no client UPDATE on threads" RLS)
-- but self-gated on is_thread_participant, so a caller can only ever clear their
-- own side of a thread they're in. Mirrors the SCR-003 is_thread_participant
-- SECURITY DEFINER pattern.
-- ===========================================================================
create or replace function public.mark_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not public.is_thread_participant(p_thread_id, v_uid) then
    return; -- no-op for anon / non-participants (no error)
  end if;

  update public.threads
     set buyer_unread  = case when buyer_id  = v_uid then 0 else buyer_unread  end,
         seller_unread = case when seller_id = v_uid then 0 else seller_unread end
   where id = p_thread_id;
end;
$$;

revoke execute on function public.mark_thread_read(uuid) from public;
grant execute on function public.mark_thread_read(uuid) to authenticated;

-- ===========================================================================
-- message-attachments Storage bucket (PRIVATE / participant-scoped).
-- Mobile uploads to `${thread_id}/${uid}-${ts}.ext`, so the first path segment
-- is the thread id → gate read + insert on thread membership. Read happens via
-- a short-lived signed URL (mobile threadsApi.signMessageAttachment).
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

create policy storage_message_attachments_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'message-attachments'
    and public.is_thread_participant(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );

create policy storage_message_attachments_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'message-attachments'
    and public.is_thread_participant(((storage.foldername(name))[1])::uuid, (select auth.uid()))
  );
