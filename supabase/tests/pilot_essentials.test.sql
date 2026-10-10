-- Pilot essentials: round-off, sold-out switch, merging tables.
-- Run with: npx supabase test db. Seed: Brew & Leaf Baner staff; prices exclude 5% GST.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

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

\set brew '''10000000-0000-4000-a000-000000000001'''
\set baner '''20000000-0000-4000-a000-000000000001'''
\set latte '''50000000-0000-4000-a000-000000000002'''
\set toast '''50000000-0000-4000-a000-000000000006'''

-- Clean slate: two free tables, an open day.
select pg_temp.logout();
update public.orders set status = 'cancelled' where outlet_id = :baner and status not in ('served', 'delivered', 'cancelled');
update public.day_sessions set closed_at = now(), counted_cash = 0 where outlet_id = :baner and closed_at is null;
insert into public.day_sessions (tenant_id, outlet_id, business_date, opening_cash) values (:brew, :baner, current_date, 0);
create temp table t (k text primary key, v uuid);
grant all on t to authenticated;
insert into t select 'tA', id from public.dining_tables where outlet_id = :baner and name = 'T1';
insert into t select 'tB', id from public.dining_tables where outlet_id = :baner and name = 'T2';
select is((select round_off from public.tenants where id = :brew), true, 'round-off is on by default');

-- ---- Two tables order; A merges into B -----------------------------------------------------------
select pg_temp.login('waiter.baner@brewleaf.test');
with x as (insert into public.orders (tenant_id, outlet_id, type, table_id) values (:brew, :baner, 'dine_in', (select v from t where k = 'tA')) returning id)
insert into t select 'A', id from x;
with x as (insert into public.orders (tenant_id, outlet_id, type, table_id) values (:brew, :baner, 'dine_in', (select v from t where k = 'tB')) returning id)
insert into t select 'B', id from x;
insert into public.order_items (tenant_id, order_id, item_id, quantity) values (:brew, (select v from t where k = 'A'), :latte, 1);
insert into public.order_items (tenant_id, order_id, item_id, quantity) values (:brew, (select v from t where k = 'B'), :toast, 1);
select public.send_kot((select v from t where k = 'A'));
select public.send_kot((select v from t where k = 'B'));
select throws_ok(format('select public.merge_orders(%L, %L)', (select v from t where k = 'A'), (select v from t where k = 'B')),
  '42501', null, 'a waiter cannot merge tables');

select pg_temp.logout();
select pg_temp.login('cashier.baner@brewleaf.test');
select throws_ok(format('select public.merge_orders(%L, %L)', (select v from t where k = 'A'), (select v from t where k = 'A')),
  '22023', null, 'cannot merge a table into itself');
select is((select (public.merge_orders((select v from t where k = 'A'), (select v from t where k = 'B'))).total),
  535.50::numeric(12, 2), 'B now carries both tables: (190 + 320) + 5% = 535.50');
select is((select status from public.orders where id = (select v from t where k = 'A')), 'cancelled'::public.order_status, 'A is closed');
select matches((select notes from public.orders where id = (select v from t where k = 'A')), 'Merged into order #', 'A says where it went');
select is((select array_agg(round_no order by round_no) from public.kots where order_id = (select v from t where k = 'B')), array[1, 2],
  'kitchen rounds moved and renumbered after B''s');
select is((select status from public.table_status where table_id = (select v from t where k = 'tA')), 'free', 'table A is free again');

-- ---- Round-off on the bill ------------------------------------------------------------------------
insert into t select 'bill', id from public.settle_bill((select v from t where k = 'B'), 0, '[{"method":"cash","amount":536}]'::jsonb);
select is((select (taxable_amount, cgst, sgst, round_off, total) from public.bills where id = (select v from t where k = 'bill')),
  (510.00::numeric(12, 2), 12.75::numeric(12, 2), 12.75::numeric(12, 2), 0.50::numeric(4, 2), 536.00::numeric(12, 2)),
  'GST on the exact amount; total rounded to 536 with +0.50 round-off');
select throws_ok(format('select public.merge_orders(%L, %L)', (select v from t where k = 'B'), (select v from t where k = 'A')),
  'P0001', null, 'billed or closed orders cannot be merged');

-- Round-off off: exact paise.
select pg_temp.logout();
update public.tenants set round_off = false where id = :brew;
select pg_temp.login('waiter.baner@brewleaf.test');
with x as (insert into public.orders (tenant_id, outlet_id, type, table_id) values (:brew, :baner, 'dine_in', (select v from t where k = 'tA')) returning id)
insert into t select 'C', id from x;
insert into public.order_items (tenant_id, order_id, item_id, quantity) values (:brew, (select v from t where k = 'C'), :latte, 1);
select pg_temp.logout();
select pg_temp.login('cashier.baner@brewleaf.test');
select is((select (round_off, total) from public.settle_bill((select v from t where k = 'C'), 0, '[{"method":"upi","amount":199.5}]'::jsonb)),
  (0.00::numeric(4, 2), 199.50::numeric(12, 2)), 'with round-off off the bill keeps its paise');

-- ---- Sold-out switch ------------------------------------------------------------------------------
select pg_temp.logout();
select pg_temp.login('kitchen.baner@brewleaf.test');
select is((select (public.set_item_available(:toast, false)).is_available), false, 'kitchen marks a dish sold out');
-- Row-level security makes the kitchen's own menu update change nothing (no error, 0 rows).
update public.menu_items set price = 1 where id = :toast;
select is((select price from public.menu_items where id = :toast), 320.00::numeric(10, 2), 'kitchen still cannot edit the menu');
select pg_temp.logout();
select pg_temp.login('waiter.baner@brewleaf.test');
select throws_ok($$select public.set_item_available('50000000-0000-4000-a000-000000000006', true)$$,
  '42501', null, 'a waiter cannot change availability');
select pg_temp.logout();
select pg_temp.login('cashier.baner@brewleaf.test');
select is((select (public.set_item_available(:toast, true)).is_available), true, 'cashier puts it back');
select pg_temp.logout();
select pg_temp.login('owner@spiceroute.test');
select throws_ok($$select public.set_item_available('50000000-0000-4000-a000-000000000006', false)$$,
  '42501', null, 'another business cannot touch this menu');

select pg_temp.logout();
select * from finish();
rollback;
