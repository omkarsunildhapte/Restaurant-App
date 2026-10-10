-- Own-rider delivery (Phase 5a): rider sign-up and verification, assign → accept → pick up →
-- deliver with OTP, cash on delivery settlement, and who can see what.
-- Run with: npx supabase test db. Uses the seed accounts (see supabase/seed.sql).
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- Look the user up before switching role: authenticated cannot read auth.users.
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

\set brew '''10000000-0000-4000-a000-000000000001'''
\set baner '''20000000-0000-4000-a000-000000000001'''
\set kp '''20000000-0000-4000-a000-000000000002'''

-- A rider for Brew & Leaf Baner (the profile is created by the auth trigger)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-a000-000000000017', 'authenticated',
        'authenticated', 'rider.baner@brewleaf.test', '', now(), '{}', '{"full_name": "Sagar Pawar"}', now(), now());
insert into public.memberships (tenant_id, user_id, role, outlet_id)
values (:brew, '00000000-0000-4000-a000-000000000017', 'delivery', :baner);

-- ---- Rider sign-up and verification ---------------------------------------------------------
select pg_temp.login('rider.baner@brewleaf.test');
insert into public.riders (tenant_id, user_id, full_name, phone, vehicle_number, verification)
values (:brew, '00000000-0000-4000-a000-000000000017', 'Sagar Pawar', '+91 98220 33333', 'MH12AB1234', 'verified');
select is((select verification::text from public.riders where full_name = 'Sagar Pawar'), 'pending',
  'new rider starts pending even if they ask for verified');

select throws_ok(
  $$update public.riders set verification = 'verified' where full_name = 'Sagar Pawar'$$,
  '42501', null, 'rider cannot verify themselves');

select throws_ok(
  $$select public.set_rider_online('10000000-0000-4000-a000-000000000001', true)$$,
  'P0001', null, 'unverified rider cannot go online');

select pg_temp.login('owner@brewleaf.test');
select throws_ok(
  $$select public.verify_rider((select id from public.riders where full_name = 'Sagar Pawar'), true)$$,
  '42501', null, 'owner cannot verify riders');

select pg_temp.login('super@platform.test');
select lives_ok(
  $$select public.verify_rider((select id from public.riders where full_name = 'Sagar Pawar'), true)$$,
  'Super Admin verifies the rider');

select pg_temp.login('rider.baner@brewleaf.test');
select lives_ok($$select public.set_rider_online('10000000-0000-4000-a000-000000000001', true)$$,
  'verified rider goes online');

-- ---- Cashier creates a COD delivery order and assigns it -------------------------------------
select pg_temp.login('cashier.baner@brewleaf.test');
with o as (
  insert into public.orders (tenant_id, outlet_id, type, customer_name, customer_phone,
                             delivery_address, delivery_charge, cash_on_delivery)
  values (:brew, :baner, 'delivery', 'Meera', '+91 90000 00001', 'Flat 4, Balewadi High Street', 30, true)
  returning id)
select set_config('test.order', id::text, true) from o;
insert into public.order_items (tenant_id, order_id, name, unit_price, quantity)
values (:brew, current_setting('test.order')::uuid, 'Cold coffee', 100, 2);

select set_config('test.rider', (select id::text from public.riders where full_name = 'Sagar Pawar'), true);

select pg_temp.login('kitchen.baner@brewleaf.test');
select throws_ok(
  $$select * from public.assign_delivery(current_setting('test.order')::uuid, current_setting('test.rider')::uuid)$$,
  '42501', null, 'kitchen cannot assign riders');

select pg_temp.login('cashier.baner@brewleaf.test');
select set_config('test.otp', a.otp, true), set_config('test.job', a.job_id::text, true)
from public.assign_delivery(current_setting('test.order')::uuid, current_setting('test.rider')::uuid) a;
select matches(current_setting('test.otp'), '^[0-9]{4}$', 'assign returns a 4-digit OTP');
select is((select cod_amount from public.delivery_jobs where id = current_setting('test.job')::uuid), 230.00,
  'COD amount = order total + delivery charge');
select throws_ok(
  $$select * from public.assign_delivery(current_setting('test.order')::uuid, current_setting('test.rider')::uuid)$$,
  'P0001', null, 'second open job for the same order is refused');
select throws_ok($$select otp_hash from public.delivery_jobs$$, '42501', null, 'OTP hash is not readable');

-- ---- Who sees the job -----------------------------------------------------------------------
select pg_temp.login('manager.kp@brewleaf.test');
select is((select count(*) from public.delivery_jobs), 0::bigint, 'other outlet manager sees no Baner jobs');
select pg_temp.login('owner@spiceroute.test');
select is((select count(*) from public.delivery_jobs), 0::bigint, 'other tenant sees no jobs');
select is((select count(*) from public.riders), 0::bigint, 'other tenant sees no riders');

select pg_temp.login('rider.baner@brewleaf.test');
select is((select count(*) from public.orders), 0::bigint, 'rider cannot read orders directly');
select is((select customer_phone from public.my_deliveries(:brew)), '+91 90000 00001',
  'rider sees customer details of an open job');
select is((select jsonb_array_length(items) from public.my_deliveries(:brew)), 1, 'rider sees the items');

-- ---- Accept → pick up → deliver -------------------------------------------------------------
select is(public.respond_to_delivery(current_setting('test.job')::uuid, true), 'assigned'::public.delivery_status,
  'rider accepts');
select throws_ok(
  $$select public.complete_delivery(current_setting('test.job')::uuid, current_setting('test.otp'), null, 230)$$,
  'P0001', null, 'cannot deliver before pickup');
select lives_ok($$select public.advance_delivery(current_setting('test.job')::uuid, 'picked_up', 18.56, 73.77)$$,
  'rider picks up (at_pickup can be skipped)');
select throws_ok($$select public.advance_delivery(current_setting('test.job')::uuid, 'at_pickup')$$,
  'P0001', null, 'job cannot go back');
select throws_ok(
  $$select public.complete_delivery(current_setting('test.job')::uuid,
      case current_setting('test.otp') when '0000' then '1111' else '0000' end, null, 230)$$,
  '22023', null, 'wrong OTP is refused');
select throws_ok(
  $$select public.complete_delivery(current_setting('test.job')::uuid, current_setting('test.otp'))$$,
  '22023', null, 'COD job needs the cash collected');
select lives_ok(
  $$select public.complete_delivery(current_setting('test.job')::uuid, current_setting('test.otp'), null, 230)$$,
  'delivered with the right OTP');
select is((select count(*) from public.my_deliveries(:brew)), 0::bigint, 'finished job leaves the open list');

select pg_temp.login('cashier.baner@brewleaf.test');
select is((select status::text from public.orders where id = current_setting('test.order')::uuid), 'delivered',
  'order is marked delivered');
select is((select array_agg(status::text order by id) from public.delivery_events
           where job_id = current_setting('test.job')::uuid),
  array['offered', 'assigned', 'picked_up', 'delivered'], 'every step is logged');

-- ---- Day close ------------------------------------------------------------------------------
select is((select difference from public.settle_cod(:baner, current_setting('test.rider')::uuid,
                                                    (now() at time zone 'Asia/Kolkata')::date, 200, 'Short by 30')),
  -30.00, 'COD settlement records the shortfall');

select pg_temp.logout();
select * from finish();
rollback;
