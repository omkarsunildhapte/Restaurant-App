-- Item-wise split bills (0009): split a line, bill some items, pay the rest, void frees items,
-- idempotent device-made ids, and who may do it.
-- Run with: npx supabase test db. Uses the seed accounts (see supabase/seed.sql).
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- These tests check split maths to the paisa, not bill rounding (0011): turn round-off off.
update public.tenants set round_off = false where id = '10000000-0000-4000-a000-000000000001';

create function pg_temp.login(p_email text) returns void language plpgsql as $$
declare
  v_id uuid;
begin
  perform set_config('role', 'postgres', true);
  select id into v_id from auth.users where email = p_email;
  perform set_config('request.jwt.claims', json_build_object('sub', v_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create function pg_temp.logout() returns void language sql as $$
  select set_config('role', 'postgres', true), set_config('request.jwt.claims', '', true);
$$;

-- Payments of one cash row for a given amount
create function pg_temp.cash(p_amount numeric) returns jsonb language sql as $$
  select jsonb_build_array(jsonb_build_object('method', 'cash', 'amount', p_amount))
$$;

-- What the bill for these items should come to (no discount): lines' subtotal + tax
create function pg_temp.due(p_ids uuid[]) returns numeric language sql security definer as $$
  select sum(line_subtotal) + sum(line_tax) from public.order_items where id = any (p_ids)
$$;

\set brew '''10000000-0000-4000-a000-000000000001'''
\set baner '''20000000-0000-4000-a000-000000000001'''

-- Fixed ids for this test
\set coffee '''a0000000-0000-4000-a000-000000000001'''
\set sandwich '''a0000000-0000-4000-a000-000000000002'''
\set cake '''a0000000-0000-4000-a000-000000000003'''
\set coffee2 '''a0000000-0000-4000-a000-000000000004'''
\set bill1 '''b0000000-0000-4000-a000-000000000001'''

-- ---- Takeaway order with three lines, counter day open --------------------------------------
select pg_temp.login('cashier.baner@brewleaf.test');
select public.open_day(:baner, 500)
where not exists (select 1 from public.day_sessions where outlet_id = :baner and closed_at is null);

with o as (
  insert into public.orders (tenant_id, outlet_id, type, customer_name)
  values (:brew, :baner, 'takeaway', 'Split test') returning id)
select set_config('test.order', id::text, true) from o;

insert into public.order_items (id, tenant_id, order_id, name, unit_price, quantity, tax_rate) values
  (:coffee, :brew, current_setting('test.order')::uuid, 'Cappuccino', 180, 2, 5),
  (:sandwich, :brew, current_setting('test.order')::uuid, 'Paneer sandwich', 220, 1, 5),
  (:cake, :brew, current_setting('test.order')::uuid, 'Brownie', 140, 1, 18);
select public.send_kot(current_setting('test.order')::uuid);

-- ---- Splitting a line -----------------------------------------------------------------------
select is((select quantity from public.split_order_item(:coffee, 1, :coffee2)), 1, 'split one coffee off');
select is((select quantity from public.order_items where id = :coffee), 1, 'original line keeps the other coffee');
select is((select kot_id is not null and kot_id = (select kot_id from public.order_items where id = :coffee)
           from public.order_items where id = :coffee2), true, 'new line stays in the same kitchen round');
select is((select id from public.split_order_item(:coffee, 1, :coffee2)), :coffee2::uuid,
  'same split sent twice returns the same line');
select is((select count(*) from public.order_items where order_id = current_setting('test.order')::uuid), 4::bigint,
  'repeat did not add another line');
select throws_ok($$select public.split_order_item('a0000000-0000-4000-a000-000000000001', 1, gen_random_uuid())$$,
  '22023', null, 'cannot split a line of one');

-- ---- Guest 1 pays for a coffee and the sandwich ---------------------------------------------
select set_config('test.due1', pg_temp.due(array[:coffee, :sandwich]::uuid[])::text, true);

select throws_ok(
  $$select public.settle_split_bill(current_setting('test.order')::uuid, 'b0000000-0000-4000-a000-000000000001',
      array['a0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000002']::uuid[], 0,
      pg_temp.cash(current_setting('test.due1')::numeric + 1))$$,
  '22023', null, 'payments must match the split bill');

select is((select total from public.settle_split_bill(current_setting('test.order')::uuid, :bill1,
            array[:coffee, :sandwich]::uuid[], 0, pg_temp.cash(current_setting('test.due1')::numeric))),
  current_setting('test.due1')::numeric, 'split bill = its own items');
select is((select id from public.settle_split_bill(current_setting('test.order')::uuid, :bill1,
            array[:coffee, :sandwich]::uuid[], 0, pg_temp.cash(current_setting('test.due1')::numeric))),
  :bill1::uuid, 'same split bill sent twice returns the same bill');
select is((select count(*) from public.bills where order_id = current_setting('test.order')::uuid), 1::bigint,
  'repeat did not make a second bill');
select is((select cgst = round((cgst + sgst) / 2, 2) and subtotal = taxable_amount from public.bills where id = :bill1),
  true, 'CGST is half the tax, no discount');
select is((select count(*) from public.order_items where bill_id = :bill1), 2::bigint, 'its items point at it');
select is((select status::text from public.orders where id = current_setting('test.order')::uuid), 'new',
  'order stays open while items are unpaid');

select throws_ok(
  $$select public.settle_split_bill(current_setting('test.order')::uuid, gen_random_uuid(),
      array['a0000000-0000-4000-a000-000000000002']::uuid[], 0, pg_temp.cash(1))$$,
  '22023', null, 'an item cannot go on two bills');
select throws_ok($$update public.order_items set quantity = 3 where id = 'a0000000-0000-4000-a000-000000000002'$$,
  'P0001', null, 'a billed item cannot be changed');
select throws_ok(
  $$select public.settle_bill(current_setting('test.order')::uuid, 999, pg_temp.cash(1))$$,
  '22023', null, 'discount cannot exceed the items being billed');

-- ---- Who may bill ---------------------------------------------------------------------------
select pg_temp.login('waiter.baner@brewleaf.test');
select throws_ok(
  $$select public.settle_split_bill(current_setting('test.order')::uuid, gen_random_uuid(),
      array['a0000000-0000-4000-a000-000000000003']::uuid[], 0, pg_temp.cash(1))$$,
  '42501', null, 'waiter cannot bill');
select pg_temp.login('owner@spiceroute.test');
select throws_ok(
  $$select public.settle_bill(current_setting('test.order')::uuid, 0, pg_temp.cash(1))$$,
  '42501', null, 'another business cannot bill this order');

-- ---- Guest 2 pays the rest with settle_bill -------------------------------------------------
select pg_temp.login('cashier.baner@brewleaf.test');
select set_config('test.due2', pg_temp.due(array[:coffee2, :cake]::uuid[])::text, true);
select is((select total from public.settle_bill(current_setting('test.order')::uuid, 0,
            pg_temp.cash(current_setting('test.due2')::numeric))),
  current_setting('test.due2')::numeric, 'settle_bill bills only what is left');
select is((select status::text from public.orders where id = current_setting('test.order')::uuid), 'served',
  'order is served once every item is billed');
select is((select sum(total) from public.bills where order_id = current_setting('test.order')::uuid and not is_void),
  (select total from public.orders where id = current_setting('test.order')::uuid), 'the bills add up to the order');
select throws_ok($$select public.settle_bill(current_setting('test.order')::uuid, 0, pg_temp.cash(1))$$,
  'P0001', null, 'nothing left to bill');

-- A device-made bill id cannot be reused for another order
with o as (
  insert into public.orders (tenant_id, outlet_id, type) values (:brew, :baner, 'takeaway') returning id)
select set_config('test.order2', id::text, true) from o;
insert into public.order_items (tenant_id, order_id, name, unit_price, quantity)
values (:brew, current_setting('test.order2')::uuid, 'Water', 20, 1);
select throws_ok(
  $$select public.settle_split_bill(current_setting('test.order2')::uuid, 'b0000000-0000-4000-a000-000000000001',
      array(select id from public.order_items where order_id = current_setting('test.order2')::uuid), 0, pg_temp.cash(20))$$,
  '23505', null, 'bill id from another order is refused');

-- ---- Voiding frees the items ----------------------------------------------------------------
select pg_temp.login('manager.baner@brewleaf.test');
update public.bills set is_void = true, void_reason = 'Wrong guest' where id = :bill1;
select is((select count(*) from public.order_items where id in (:coffee, :sandwich) and bill_id is null), 2::bigint,
  'voided bill frees its items');

-- ---- With round-off on (0011), each split bill rounds on its own amount --------------------
select pg_temp.logout();
update public.tenants set round_off = true where id = :brew;
select pg_temp.login('cashier.baner@brewleaf.test');

with o as (
  insert into public.orders (tenant_id, outlet_id, type) values (:brew, :baner, 'takeaway') returning id)
select set_config('test.order3', id::text, true) from o;
\set tea '''a0000000-0000-4000-a000-000000000011'''
\set cookie '''a0000000-0000-4000-a000-000000000012'''
-- Prices chosen to leave paise whether menu prices include GST or not
insert into public.order_items (id, tenant_id, order_id, name, unit_price, quantity, tax_rate) values
  (:tea, :brew, current_setting('test.order3')::uuid, 'Masala chai', 99.99, 1, 5),
  (:cookie, :brew, current_setting('test.order3')::uuid, 'Cookie', 50.50, 1, 5);
select set_config('test.exact3', pg_temp.due(array[:tea]::uuid[])::text, true);
select set_config('test.rest3', pg_temp.due(array[:cookie]::uuid[])::text, true);

select throws_ok(
  $$select public.settle_split_bill(current_setting('test.order3')::uuid, gen_random_uuid(),
      array['a0000000-0000-4000-a000-000000000011']::uuid[], 0, pg_temp.cash(current_setting('test.exact3')::numeric))$$,
  '22023', null, 'with round-off, paying the unrounded split amount is refused');
select is((select total || ' ' || round_off from public.settle_split_bill(current_setting('test.order3')::uuid, gen_random_uuid(),
            array[:tea]::uuid[], 0, pg_temp.cash(round(current_setting('test.exact3')::numeric)))),
  round(current_setting('test.exact3')::numeric)::numeric(12, 2) || ' '
    || (round(current_setting('test.exact3')::numeric) - current_setting('test.exact3')::numeric)::numeric(4, 2),
  'split bill is rounded to the rupee on its own amount');
select is((select total from public.settle_bill(current_setting('test.order3')::uuid, 0,
            pg_temp.cash(round(current_setting('test.rest3')::numeric)))),
  round(current_setting('test.rest3')::numeric)::numeric(12, 2), 'the rest is rounded on its own amount too');
select is((select bool_and(total = round(total) and cgst + sgst + taxable_amount + round_off = total)
           from public.bills where order_id = current_setting('test.order3')::uuid),
  true, 'each bill: whole rupees, and taxable + GST + round-off = total');

select pg_temp.logout();
select * from finish();
rollback;
