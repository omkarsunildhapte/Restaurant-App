-- Super Admin and reporting RPCs.

-- Create a restaurant: tenant + first outlet + standard GST rates + owner (added or invited).
-- Returns {"tenant_id", "outlet_id", "owner": "added" | "invited"}.
create function public.create_tenant(
  p_name text,
  p_slug text,
  p_owner_email text,
  p_plan_id text default 'pro',
  p_outlet_name text default null,
  p_city text default null,
  p_phone text default null,
  p_trial_days int default 14
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_outlet uuid;
  v_owner text;
begin
  if not private.is_super_admin() then
    raise exception 'Super Admin only' using errcode = '42501';
  end if;
  if p_trial_days < 0 or p_trial_days > 90 then
    raise exception 'Trial must be 0 to 90 days' using errcode = '22023';
  end if;

  insert into public.tenants (name, slug, plan_id, phone, status, trial_ends_at)
  values (trim(p_name), lower(trim(p_slug)), p_plan_id, p_phone,
          case when p_trial_days > 0 then 'trial' else 'active' end::public.tenant_status,
          case when p_trial_days > 0 then now() + make_interval(days => p_trial_days) end)
  returning id into v_tenant;

  insert into public.outlets (tenant_id, name, city, phone)
  values (v_tenant, coalesce(nullif(trim(p_outlet_name), ''), trim(p_name)), p_city, p_phone)
  returning id into v_outlet;

  insert into public.tax_rates (tenant_id, name, rate, is_default) values
    (v_tenant, 'GST 5%', 5, true),
    (v_tenant, 'GST 18%', 18, false),
    (v_tenant, 'No GST', 0, false);

  v_owner := public.invite_member(v_tenant, p_owner_email, 'owner', null);

  return jsonb_build_object('tenant_id', v_tenant, 'outlet_id', v_outlet, 'owner', v_owner);
exception
  when unique_violation then
    raise exception 'The web address "%" is already taken', lower(trim(p_slug)) using errcode = '23505';
end $$;

-- Platform dashboard numbers for Super Admin.
create function public.platform_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v jsonb;
begin
  if not private.is_super_admin() then
    raise exception 'Super Admin only' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'tenants_total', (select count(*) from public.tenants),
    'by_status', coalesce((select jsonb_object_agg(status, n)
                           from (select status, count(*) n from public.tenants group by status) s), '{}'),
    'by_plan', coalesce((select jsonb_object_agg(plan_id, n)
                         from (select plan_id, count(*) n from public.tenants
                               where status in ('trial', 'active', 'past_due') group by plan_id) s), '{}'),
    'mrr', coalesce((select sum(p.price_monthly) from public.tenants t join public.plans p on p.id = t.plan_id
                     where t.status in ('active', 'past_due')), 0),
    'new_last_30_days', (select count(*) from public.tenants where created_at > now() - interval '30 days'),
    'outlets_total', (select count(*) from public.outlets where is_active),
    'staff_total', (select count(*) from public.memberships where is_active),
    'orders_last_30_days', (select count(*) from public.orders where created_at > now() - interval '30 days'),
    'trials_ending', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'trial_ends_at', trial_ends_at) order by trial_ends_at)
      from public.tenants
      where status = 'trial' and trial_ends_at < now() + interval '7 days'), '[]'),
    'recent_tenants', coalesce((
      select jsonb_agg(r) from (
        select id, name, slug, status, plan_id, created_at from public.tenants
        order by created_at desc limit 5) r), '[]')
  ) into v;
  return v;
end $$;

-- Business report for one tenant (optionally one outlet) over a date range, in the tenant's
-- time zone. Runs as the caller, so RLS decides what is counted.
create function public.business_report(
  p_tenant uuid,
  p_from date,
  p_to date,
  p_outlet uuid default null
) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_tz text;
  v jsonb;
begin
  if not private.can(p_tenant, '{admin,owner,manager}', p_outlet) then
    raise exception 'Reports are for owners and managers' using errcode = '42501';
  end if;
  select timezone into v_tz from public.tenants where id = p_tenant;

  with o as (
    select o.*, (o.created_at at time zone v_tz) as local_at
    from public.orders o
    where o.tenant_id = p_tenant
      and (p_outlet is null or o.outlet_id = p_outlet)
      and (o.created_at at time zone v_tz)::date between p_from and p_to
  ), live as (
    select * from o where status <> 'cancelled'
  )
  select jsonb_build_object(
    'orders', (select count(*) from live),
    'cancelled', (select count(*) from o where status = 'cancelled'),
    'revenue', (select coalesce(sum(total), 0) from live),
    'tax', (select coalesce(sum(tax_total), 0) from live),
    'average_order', (select coalesce(round(avg(total), 2), 0) from live),
    'by_day', coalesce((select jsonb_agg(d order by d.day) from (
        select local_at::date as day, count(*) as orders, sum(total) as revenue
        from live group by 1) d), '[]'),
    'by_hour', coalesce((select jsonb_agg(h order by h.hour) from (
        select extract(hour from local_at)::int as hour, count(*) as orders, sum(total) as revenue
        from live group by 1) h), '[]'),
    'by_type', coalesce((select jsonb_object_agg(type, n) from (
        select type, count(*) n from live group by type) t), '{}'),
    'top_items', coalesce((select jsonb_agg(i) from (
        select oi.name, sum(oi.quantity) as quantity, sum(oi.line_total) as revenue
        from public.order_items oi join live on live.id = oi.order_id
        group by oi.name order by sum(oi.quantity) desc, oi.name limit 10) i), '[]')
  ) into v;
  return v;
end $$;

revoke execute on function public.create_tenant(text, text, text, text, text, text, text, int),
  public.platform_stats(), public.business_report(uuid, date, date, uuid) from anon, public;
grant execute on function public.create_tenant(text, text, text, text, text, text, text, int),
  public.platform_stats(), public.business_report(uuid, date, date, uuid) to authenticated;
