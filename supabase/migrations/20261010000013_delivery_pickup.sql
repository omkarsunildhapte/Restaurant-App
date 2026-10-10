-- Rider app (Phase 5a): the rider's job list also gives the outlet's map position, so the app
-- can navigate to the pickup as well as the drop. Outlets carry latitude/longitude since 0001
-- (Nominatim cache, set from the Business panel). Otherwise my_deliveries is unchanged from 0005.
--
-- The result columns change, so the function is dropped and created again (create or replace
-- cannot change a table function's columns), with the same grants.

drop function public.my_deliveries(uuid, boolean);

create function public.my_deliveries(p_tenant uuid, p_open_only boolean default true)
returns table (
  job_id uuid, status public.delivery_status, attempt_no int, offered_at timestamptz,
  accepted_at timestamptz, finished_at timestamptz, cod_amount numeric, cod_collected numeric,
  outlet_id uuid, outlet_name text, outlet_address text, outlet_phone text,
  outlet_lat numeric, outlet_lng numeric,
  order_id uuid, order_no int, customer_name text, customer_phone text, delivery_address text,
  delivery_lat numeric, delivery_lng numeric, order_notes text, order_total numeric, items jsonb
)
language sql stable security definer set search_path = '' as $$
  select j.id, j.status, j.attempt_no, j.offered_at, j.accepted_at, j.finished_at, j.cod_amount, j.cod_collected,
         ou.id, ou.name, ou.address, ou.phone,
         ou.latitude, ou.longitude,
         o.id, o.order_no,
         case when j.finished_at is null then o.customer_name end,
         case when j.finished_at is null then o.customer_phone end,
         case when j.finished_at is null then o.delivery_address end,
         case when j.finished_at is null then o.delivery_lat end,
         case when j.finished_at is null then o.delivery_lng end,
         case when j.finished_at is null then o.notes end,
         o.total + o.delivery_charge,
         (select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'variant', i.variant_name,
                                                       'quantity', i.quantity) order by i.created_at), '[]')
          from public.order_items i where i.order_id = o.id)
  from public.delivery_jobs j
  join public.riders r on r.id = j.rider_id
  join public.orders o on o.id = j.order_id
  join public.outlets ou on ou.id = j.outlet_id
  where j.tenant_id = p_tenant and r.user_id = auth.uid()
    and (not p_open_only or j.finished_at is null)
  order by j.offered_at desc
  limit 200
$$;

revoke execute on function public.my_deliveries(uuid, boolean) from anon, public;
grant execute on function public.my_deliveries(uuid, boolean) to authenticated, service_role;
