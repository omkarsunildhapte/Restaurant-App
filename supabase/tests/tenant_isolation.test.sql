-- Tenant isolation and role checks. Run with: npx supabase test db
-- Uses the seed accounts (see supabase/seed.sql).
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

create function pg_temp.login(p_email text) returns void language plpgsql as $$
declare
  v_id uuid := (select id from auth.users where email = p_email);
begin
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- Fixed ids from the seed
\set brew '''10000000-0000-4000-a000-000000000001'''
\set spice '''10000000-0000-4000-a000-000000000002'''
\set baner '''20000000-0000-4000-a000-000000000001'''
\set kp '''20000000-0000-4000-a000-000000000002'''

-- ---- Owner of Spice Route sees only Spice Route ----------------------------------------------
select pg_temp.login('owner@spiceroute.test');
select is((select count(*) from public.tenants), 1::bigint, 'owner sees one tenant');
select is((select count(*) from public.menu_items where tenant_id = :brew), 0::bigint, 'no other tenant menu');
select is((select count(*) from public.orders where tenant_id = :brew), 0::bigint, 'no other tenant orders');
select is((select count(*) from public.bills where tenant_id = :brew), 0::bigint, 'no other tenant bills');
select is((select count(*) from public.outlets where tenant_id = :brew), 0::bigint, 'no other tenant outlets');
select is((select count(*) from public.memberships where tenant_id = :brew), 0::bigint, 'no other tenant staff');
select is((select count(*) from public.profiles where email like '%brewleaf%'), 0::bigint, 'no other tenant people');
select is((select count(*) from public.tenant_notes), 0::bigint, 'owners cannot read internal notes');

select throws_ok(
  $$insert into public.menu_items (tenant_id, category_id, name, price)
    values ('10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000001', 'Hack', 1)$$,
  '42501', null, 'cannot insert into another tenant');

-- Own category id but pointing at another tenant's category: composite FK refuses it
select throws_ok(
  $$insert into public.menu_items (tenant_id, category_id, name, price)
    values ('10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000001', 'Cross', 1)$$,
  '23503', null, 'cannot reference another tenant''s category');

update public.menu_items set price = 1 where tenant_id = :brew;
select pg_temp.logout();
select is((select min(price) from public.menu_items where tenant_id = :brew) > 1, true,
  'update on another tenant changed nothing');

-- ---- Subscription fields belong to Super Admin -----------------------------------------------
select pg_temp.login('owner@spiceroute.test');
select throws_ok($$update public.tenants set status = 'active' where slug = 'spice-route'$$,
  '42501', null, 'owner cannot activate own subscription');
select lives_ok($$update public.tenants set legal_name = 'Spice Route Foods' where slug = 'spice-route'$$,
  'owner can edit business details');
select throws_ok($$update public.profiles set is_super_admin = true where email = 'owner@spiceroute.test'$$,
  '42501', null, 'cannot make yourself Super Admin');
select throws_ok($$select public.platform_stats()$$, '42501', null, 'platform stats are Super Admin only');
select pg_temp.logout();

-- ---- Outlet-scoped manager -------------------------------------------------------------------
select pg_temp.login('manager.baner@brewleaf.test');
select is((select count(*) from public.orders where outlet_id = :kp), 0::bigint, 'Baner manager cannot see KP orders');
select ok((select count(*) from public.orders where outlet_id = :baner) > 0, 'Baner manager sees Baner orders');
select is((select count(*) from public.dining_tables where outlet_id = :kp), 0::bigint, 'Baner manager cannot see KP tables');
select ok((select count(*) from public.menu_items) > 0, 'manager reads the shared menu');
select throws_ok($$insert into public.dining_tables (tenant_id, outlet_id, name)
  values ('10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', 'X1')$$,
  '42501', null, 'Baner manager cannot add KP tables');
select throws_ok($$select public.invite_member('10000000-0000-4000-a000-000000000001', 'x@y.test', 'waiter')$$,
  '42501', null, 'manager cannot invite staff');
select pg_temp.logout();

-- ---- Kitchen and waiter ----------------------------------------------------------------------
select pg_temp.login('kitchen.baner@brewleaf.test');
select throws_ok($$insert into public.menu_categories (tenant_id, name)
  values ('10000000-0000-4000-a000-000000000001', 'Kitchen special')$$,
  '42501', null, 'kitchen cannot edit the menu');
select is((select count(*) from public.bills), 0::bigint, 'kitchen cannot see bills');
select pg_temp.logout();

select pg_temp.login('waiter.baner@brewleaf.test');
insert into public.orders (tenant_id, outlet_id, type) values (:brew, :baner, 'takeaway');
insert into public.order_items (tenant_id, order_id, item_id, quantity)
select :brew, id, '50000000-0000-4000-a000-000000000001', 2
from public.orders where outlet_id = :baner order by order_no desc limit 1;
select is((select total from public.orders where outlet_id = :baner order by order_no desc limit 1),
  378.00, 'waiter order: 2 × 180 + 5% GST = 378');
select throws_ok($$update public.orders set status = 'cancelled'
  where outlet_id = '20000000-0000-4000-a000-000000000001' and status = 'new'$$,
  '42501', null, 'waiter cannot cancel orders');
select pg_temp.logout();

select pg_temp.login('kitchen.baner@brewleaf.test');
select lives_ok($$update public.orders set status = 'preparing'
  where id = (select id from public.orders where outlet_id = '20000000-0000-4000-a000-000000000001'
              order by order_no desc limit 1)$$, 'kitchen moves the order to preparing');
select throws_ok($$update public.orders set status = 'new'
  where id = (select id from public.orders where outlet_id = '20000000-0000-4000-a000-000000000001'
              order by order_no desc limit 1)$$, 'P0001', null, 'status cannot go backwards');
select pg_temp.logout();

-- ---- Owner manages staff, cannot hand out Admin or change own role ---------------------------
select pg_temp.login('owner@brewleaf.test');
select is(public.invite_member(:brew, 'new.waiter@brewleaf.test', 'waiter', :kp), 'invited', 'owner invites new staff');
select throws_ok($$select public.invite_member('10000000-0000-4000-a000-000000000001', 'boss@brewleaf.test', 'admin')$$,
  '42501', null, 'owner cannot invite an Admin');
select throws_ok($$update public.memberships set role = 'manager'
  where user_id = '00000000-0000-4000-a000-000000000011'$$, '42501', null, 'owner cannot change own role');
select pg_temp.logout();

-- ---- Expired trial is read-only ----------------------------------------------------------------
update public.tenants set trial_ends_at = now() - interval '1 day' where id = :spice;
select pg_temp.login('owner@spiceroute.test');
select throws_ok($$insert into public.menu_categories (tenant_id, name)
  values ('10000000-0000-4000-a000-000000000002', 'After trial')$$, '42501', null, 'expired trial cannot write');
select pg_temp.logout();

select * from finish();
rollback;
