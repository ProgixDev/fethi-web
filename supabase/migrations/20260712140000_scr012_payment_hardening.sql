-- SCR-012 — Payment/entitlement hardening (review fixes A5 + B3).
-- Additive, forward-only. See docs/db/decisions/SCR-012.md.
--
-- A5: app_entitlements out-of-order guard. RevenueCat webhooks are NOT ordered;
--     a late RENEWAL arriving after a CANCELLATION must not clobber newer state.
--     We stamp each write with the event's own timestamp and a BEFORE UPDATE
--     trigger drops any update carrying an older event_ts (keeps the newer row).
-- B3: atomic order pickup confirmation. The edge function's read-modify-write of
--     buyer_confirmed/seller_confirmed loses a confirmation when both parties
--     confirm at once. A single-statement RPC (service-role only) makes it atomic.

-- ===========================================================================
-- A5 — app_entitlements.event_ts + stale-event guard
-- ===========================================================================
alter table public.app_entitlements
  add column event_ts timestamptz;

create or replace function public.app_entitlements_reject_stale()
returns trigger
language plpgsql
as $$
begin
  -- Both known and the incoming event is older → keep the existing (newer) row.
  if OLD.event_ts is not null
     and NEW.event_ts is not null
     and NEW.event_ts < OLD.event_ts then
    return null;  -- skip this UPDATE, OLD is preserved
  end if;
  return NEW;
end;
$$;

create trigger app_entitlements_no_stale_update
  before update on public.app_entitlements
  for each row execute function public.app_entitlements_reject_stale();

-- ===========================================================================
-- B3 — atomic pickup confirmation
-- One statement flips only the caller's confirmation flag and derives status,
-- so two simultaneous confirmations can't lose one. Guarded to a party of the
-- order and to non-terminal states. SECURITY INVOKER: it is called by the
-- orders-transition Edge Function with the SERVICE ROLE (which bypasses RLS),
-- and EXECUTE is revoked from client roles so it is not a public RPC.
-- ===========================================================================
create or replace function public.confirm_order_pickup(
  p_order_id uuid,
  p_actor uuid
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  result public.orders;
begin
  update public.orders o
  set
    buyer_confirmed  = o.buyer_confirmed  or (o.buyer_id  = p_actor),
    seller_confirmed = o.seller_confirmed or (o.seller_id = p_actor),
    status = case
      when (o.buyer_confirmed  or o.buyer_id  = p_actor)
       and (o.seller_confirmed or o.seller_id = p_actor)
      then 'COMPLETED'
      else 'HANDOFF_PENDING'
    end,
    completed_at = case
      when (o.buyer_confirmed  or o.buyer_id  = p_actor)
       and (o.seller_confirmed or o.seller_id = p_actor)
      then now()
      else o.completed_at
    end
  where o.id = p_order_id
    and o.status in ('AWAITING_PICKUP', 'HANDOFF_PENDING')
    and (o.buyer_id = p_actor or o.seller_id = p_actor)
  returning o.* into result;

  return result;  -- NULL row if not found / not a party / terminal
end;
$$;

-- Not a public RPC: only the service-role Edge Function may call it.
revoke execute on function public.confirm_order_pickup(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_order_pickup(uuid, uuid) to service_role;
