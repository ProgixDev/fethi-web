-- SCR-013 — fix confirm_order_pickup enum cast (bugfix for SCR-012 B3).
-- The CASE branches produced `text`, but orders.status is the `order_status`
-- enum, so a successful confirmation failed with:
--   column "status" is of type order_status but expression is of type text
-- Assignment does not implicitly cast text → enum (unlike comparisons), so the
-- branches must be cast explicitly. Same signature/return → no type regen.
-- Forward-only. See docs/db/decisions/SCR-013.md.

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
      then 'COMPLETED'::public.order_status
      else 'HANDOFF_PENDING'::public.order_status
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

  return result;
end;
$$;

revoke execute on function public.confirm_order_pickup(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_order_pickup(uuid, uuid) to service_role;
