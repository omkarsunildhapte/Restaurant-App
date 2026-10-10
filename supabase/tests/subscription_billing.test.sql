-- Subscription billing: prices, monthly GST invoices, payments, overdue and the billing cycle.
-- Run with: npx supabase test db. Seed: Brew & Leaf is active (Chain), Spice Route is in trial.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

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
\set spice '''10000000-0000-4000-a000-000000000002'''

-- ---- Only Super Admin runs billing -------------------------------------------------------------
select pg_temp.logout();
select pg_temp.login('owner@brewleaf.test');
select throws_ok($$select public.raise_subscription_invoices()$$, '42501', null, 'owner cannot raise invoices');
select throws_ok($$select public.billing_overview()$$, '42501', null, 'owner cannot see platform billing');
select throws_ok($$insert into public.tenant_billing (tenant_id, monthly_price) values ('10000000-0000-4000-a000-000000000001', 1)$$,
  '42501', null, 'owner cannot set their own price');

-- ---- Founding price and the month's invoice -----------------------------------------------------
select pg_temp.logout();
select pg_temp.login('super@platform.test');
insert into public.tenant_billing (tenant_id, monthly_price, is_founding, price_locked_until)
values (:brew, 3999, true, current_date + 365);
update public.platform_settings set seller_gstin = '27AAACV1234D1Z5' where id = 1;

select is(public.raise_subscription_invoices(), 1, 'one paying restaurant gets this month''s invoice');
select is(public.raise_subscription_invoices(), 0, 'running it again raises nothing new');

create temp table inv as select * from public.subscription_invoices where tenant_id = :brew;
grant select on inv to authenticated;
select is((select amount from inv), 3999.00::numeric(12, 2), 'invoice uses the founding price, not the plan price');
select is((select (cgst, sgst, total) from inv), (359.91::numeric(12, 2), 359.91::numeric(12, 2), 4718.82::numeric(12, 2)),
  '18% GST split CGST + SGST');
select matches((select invoice_no from inv), '^SUB/[0-9]{4}-[0-9]{2}/0001$', 'first SaaS invoice of the financial year');
select is((select (seller_gstin, buyer_name, buyer_gstin) from inv), ('27AAACV1234D1Z5'::text, 'Brew and Leaf Foods LLP'::text, '27AABFB1234C1Z5'::text),
  'seller and buyer details are copied onto the invoice');

-- ---- The restaurant sees its own invoices only ---------------------------------------------------
select pg_temp.logout();
select pg_temp.login('owner@brewleaf.test');
select is((select count(*) from public.subscription_invoices), 1::bigint, 'owner sees their invoice');
select is((select monthly_price from public.tenant_billing), 3999.00::numeric(10, 2), 'owner sees their price');
select pg_temp.logout();
select pg_temp.login('owner@spiceroute.test');
select is((select count(*) from public.subscription_invoices), 0::bigint, 'another restaurant sees none');

-- ---- Payments, overdue, back to active ----------------------------------------------------------
select pg_temp.logout();
update public.subscription_invoices set due_on = current_date - 3 where id = (select id from inv);
select pg_temp.login('super@platform.test');
select throws_ok(format('select public.record_subscription_payment(%L, 5000, %L)', (select id from inv), 'upi'),
  '22023', null, 'cannot pay more than is due');
select is((select (public.record_subscription_payment((select id from inv), 2000, 'upi', 'UTR1')).status), 'open'::public.subscription_invoice_status,
  'part payment keeps the invoice open');
select is(public.mark_overdue(), 1, 'overdue invoice marks the restaurant');
select is((select status from public.tenants where id = :brew), 'past_due'::public.tenant_status, 'restaurant is past due');
select is((select (public.record_subscription_payment((select id from inv), 2718.82, 'cash')).status), 'paid'::public.subscription_invoice_status,
  'the rest pays the invoice');
select is((select status from public.tenants where id = :brew), 'active'::public.tenant_status, 'paying everything makes it active again');
select throws_ok(format('select public.void_subscription_invoice(%L, %L)', (select id from inv), 'mistake'),
  'P0001', null, 'a paid invoice cannot be voided');

-- ---- Billing cycle: expired trials past the grace are suspended -----------------------------------
select pg_temp.logout();
update public.tenants set trial_ends_at = now() - interval '10 days' where id = :spice;
update public.platform_settings set trial_grace_days = 7 where id = 1;
select pg_temp.login('super@platform.test');
select is((select (public.run_billing_cycle() ->> 'trialsSuspended')::int), 1, 'expired unpaid trial is suspended after the grace');

select pg_temp.logout();
select * from finish();
rollback;
