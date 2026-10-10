-- Staff operations: KOT rounds, table status, settling bills with split payments, day close,
-- financial-year bill numbers. Run with: npx supabase test db
-- Uses the seed accounts (see supabase/seed.sql): Brew & Leaf Baner staff.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

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
\set cappuccino '''50000000-0000-4000-a000-000000000001'''
\set toast '''50000000-0000-4000-a000-000000000006'''

-- A clean table and no open day for the test (seed data may have both).
select pg_temp.logout();
update public.day_sessions set closed_at = now(), counted_cash = 0 where outlet_id = :baner and closed_at is null;
create temp table t (k text primary key, v uuid);
grant all on t to authenticated;
insert into t select 'table', id from public.dining_tables where outlet_id = :baner and name = 'T8';
update public.orders set status = 'cancelled'
where table_id = (select v from t where k = 'table') and status not in ('served', 'delivered', 'cancelled');

-- ---- Waiter: order, first round to the kitchen -----------------------------------------------
select pg_temp.logout();
select pg_temp.login('waiter.baner@brewleaf.test');
with x as (
  insert into public.orders (tenant_id, outlet_id, type, table_id)
  values (:brew, :baner, 'dine_in', (select v from t where k = 'table')) returning id)
insert into t select 'order', id from x;
insert into public.order_items (tenant_id, order_id, item_id, quantity)
values (:brew, (select v from t where k = 'order'), :cappuccino, 2);

select is((select status from public.table_status where table_id = (select v from t where k = 'table')),
  'occupied', 'table with an open order is occupied');
select is((select (public.send_kot((select v from t where k = 'order'))).round_no), 1, 'first KOT is round 1');
select is((select count(*) from public.order_items where order_id = (select v from t where k = 'order') and kot_id is null),
  0::bigint, 'sent items are attached to the KOT');
select throws_ok(format('select public.send_kot(%L)', (select v from t where k = 'order')),
  'P0001', 'Nothing new to send to the kitchen', 'nothing new to send');
select throws_ok(format('update public.order_items set quantity = 5 where order_id = %L', (select v from t where k = 'order')),
  '42501', null, 'waiter cannot change an item already in the kitchen');
select throws_ok(format('update public.order_items set kot_id = null where order_id = %L', (select v from t where k = 'order')),
  '42501', null, 'kot_id cannot be set by clients');

-- Second round on the same order.
insert into public.order_items (tenant_id, order_id, item_id, quantity)
values (:brew, (select v from t where k = 'order'), :toast, 1);
select is((select (public.send_kot((select v from t where k = 'order'))).round_no), 2, 'second round is round 2');

-- ---- Kitchen: moves KOTs forward only; the order follows ---------------------------------------
select pg_temp.logout();
select pg_temp.login('kitchen.baner@brewleaf.test');
select is((select count(*) from public.kots where order_id = (select v from t where k = 'order')), 2::bigint,
  'kitchen sees both rounds');
update public.kots set status = 'preparing' where order_id = (select v from t where k = 'order') and round_no = 1;
select is((select status from public.orders where id = (select v from t where k = 'order')), 'new'::public.order_status,
  'order waits for every round (round 2 still new)');
update public.kots set status = 'ready' where order_id = (select v from t where k = 'order');
select is((select status from public.orders where id = (select v from t where k = 'order')), 'ready'::public.order_status,
  'order is ready when all rounds are ready');
update public.kots set status = 'served' where order_id = (select v from t where k = 'order');
select is((select status from public.orders where id = (select v from t where k = 'order')), 'ready'::public.order_status,
  'serving KOTs never closes the order; billing does');
select throws_ok(format('update public.kots set status = %L where order_id = %L and round_no = 1', 'new', (select v from t where k = 'order')),
  'P0001', null, 'a served KOT cannot go back');
select throws_ok(format('update public.kots set status = %L where order_id = %L and round_no = 2', 'cancelled', (select v from t where k = 'order')),
  'P0001', null, 'a served KOT cannot be cancelled');
select throws_ok(format('select public.settle_bill(%L, 0, %L::jsonb)', (select v from t where k = 'order'), '[{"method":"cash","amount":1}]'),
  '42501', null, 'kitchen cannot bill');

-- ---- Waiter asks for the bill ------------------------------------------------------------------
select pg_temp.logout();
select pg_temp.login('waiter.baner@brewleaf.test');
select lives_ok(format('select public.request_bill(%L)', (select v from t where k = 'order')), 'waiter requests the bill');
select is((select status from public.table_status where table_id = (select v from t where k = 'table')),
  'bill_requested', 'table shows bill requested');
select throws_ok($$select public.open_day('20000000-0000-4000-a000-000000000001', 0)$$, '42501', null, 'waiter cannot open the day');

-- ---- Cashier: day, split payments, bill number -------------------------------------------------
select pg_temp.logout();
select pg_temp.login('cashier.baner@brewleaf.test');
select throws_ok(format('select public.settle_bill(%L, 0, %L::jsonb)', (select v from t where k = 'order'), '[{"method":"cash","amount":1}]'),
  'P0001', 'Open the day at the counter before billing', 'billing needs an open day');
select is((select (public.open_day(:baner, 500)).opening_cash), 500::numeric(12, 2), 'cashier opens the day with 500');
select throws_ok($$select public.open_day('20000000-0000-4000-a000-000000000001', 0)$$, 'P0001', null, 'only one open day per outlet');

-- 2 x 180 + 320 = 680, + 5% GST = 714 (Brew & Leaf prices exclude tax).
select throws_ok(format('select public.settle_bill(%L, 0, %L::jsonb)', (select v from t where k = 'order'), '[{"method":"cash","amount":700}]'),
  '22023', null, 'payments must add up to the bill');
insert into t select 'bill', id from public.settle_bill((select v from t where k = 'order'), 0,
  '[{"method":"cash","amount":400},{"method":"upi","amount":314,"reference":"UPI123"}]'::jsonb);
select is((select payment_mode from public.bills where id = (select v from t where k = 'bill')), 'other'::public.payment_mode,
  'split bill is recorded as mixed payment');
select is((select count(*) from public.bill_payments where bill_id = (select v from t where k = 'bill')), 2::bigint,
  'both payments are stored');
select matches((select invoice_no from public.bills where id = (select v from t where k = 'bill')),
  '^[0-9]{4}-[0-9]{2}/[0-9]{5}$', 'invoice number carries the financial year');
select is((select status from public.table_status where table_id = (select v from t where k = 'table')), 'free',
  'settled table is free again');

select is((select (public.close_day(:baner, 890, 'short by 10')).cash_difference), -10::numeric(12, 2),
  'close: expected 500 opening + 400 cash, counted 890');

-- ---- Another business sees none of it ----------------------------------------------------------
select pg_temp.logout();
select pg_temp.login('owner@spiceroute.test');
select is((select count(*) from public.kots where tenant_id = :brew), 0::bigint, 'other tenant sees no KOTs');

select pg_temp.logout();
select * from finish();
rollback;
