-- SCR-007 — Per-reporter rate-limit on reports (server-side).
-- Additive, forward-only. See docs/db/decisions/SCR-007.md.
-- SCR-005 left reports without a cap ("enforced in the Edge Function"); mobile now
-- inserts reports directly via Supabase, so the cap lives in the DB.

-- BEFORE INSERT trigger: block a reporter who already filed >= 5 reports in the
-- last hour. SECURITY DEFINER so it can count the reporter's rows past the
-- insert-only RLS on `reports`. Raises 'RATE_LIMITED' (SQLSTATE P0001), which the
-- mobile client maps to ApiError(code: 'RATE_LIMITED').
create or replace function public.enforce_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recent integer;
begin
  select count(*) into v_recent
    from public.reports
   where reporter_id = new.reporter_id
     and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    raise exception 'RATE_LIMITED' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_report_rate_limit();
