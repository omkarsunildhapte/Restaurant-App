-- Salaries, purchases and cash out at day close. Run with: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

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
\set kp '''20000000-0000-4000-a000-000000000002'''

create temp table t (k text primary key, v uuid);
grant all on t to authenticated;
update public.day_sessions set closed_at = now(), counted_cash = 0 where outlet_id = :baner and closed_at is null;

-- ---- Salaries: owner only ----------------------------------------------------------------------
select pg_temp.login('owner@brewleaf.test');
insert into public.employees (tenant_id, outlet_id, full_name, job_title, joined_on)
values (:brew, :baner, 'Ramesh Pawar', 'Helper', '2026-01-01') returning id \gset emp_
insert into t values ('emp', :'emp_id');
insert into public.employee_pay_rates (tenant_id, employee_id, pay_type, rate, effective_from)
values (:brew, :'emp_id', 'monthly', 12000, '2026-01-01'),
       (:brew, :'emp_id', 'monthly', 13000, '2026-10-01');   -- raise from October
insert into public.salary_entries (tenant_id, employee_id, kind, amount, period_month, payment_mode, outlet_id)
values (:brew, :'emp_id', 'advance', 2000, '2026-10-01', 'upi', null),
       (:brew, :'emp_id', 'bonus', 500, '2026-10-01', 'upi', null),
       (:brew, :'emp_id', 'deduction', 300, '2026-10-01', null, null);

select is((select rate from public.salary_month(:brew, '2026-10-15') where employee_id = :'emp_id'), 13000.00::numeric,
  'October uses the new rate');
select is((select rate from public.salary_month(:brew, '2026-09-01') where employee_id = :'emp_id'), 12000.00::numeric,
  'September keeps the old rate');
select is((select balance from public.salary_month(:brew, '2026-10-01') where employee_id = :'emp_id'), 11200.00::numeric,
  'balance = 13000 + 500 bonus − 300 deduction − 2000 advance');
select throws_ok($$insert into public.salary_entries (tenant_id, employee_id, kind, amount, period_month, payment_mode)
  values ('10000000-0000-4000-a000-000000000001', (select v from t where k = 'emp'), 'salary', 100, '2026-10-01', 'cash')$$,
  '23514', null, 'a cash payment must say whose drawer it came from');
select pg_temp.logout();

select pg_temp.login('manager.baner@brewleaf.test');
select is((select count(*) from public.employees), 0::bigint, 'managers cannot see employees');
select is((select count(*) from public.salary_entries), 0::bigint, 'or salary entries');
select throws_ok($$select * from public.salary_month('10000000-0000-4000-a000-000000000001', '2026-10-01')$$,
  '42501', null, 'or the month view');

-- ---- Purchases: managers of their outlet ---------------------------------------------------------
insert into public.vendors (tenant_id, name) values (:brew, 'Shree Dairy') returning id \gset ven_
insert into public.purchases (tenant_id, outlet_id, vendor_id, gst_amount, payment_mode)
values (:brew, :baner, :'ven_id', 5, 'cash') returning id \gset pur_
insert into public.purchase_items (tenant_id, purchase_id, item_name, quantity, unit, rate) values
  (:brew, :'pur_id', 'Milk', 2.5, 'l', 40);
select is((select total from public.purchases where id = :'pur_id'), 105.00::numeric, 'total = 2.5 l × ₹40 + ₹5 GST');
select is((select vendor_name from public.purchases where id = :'pur_id'), 'Shree Dairy', 'vendor name kept on the purchase');
select ok((select paid_at is not null from public.purchases where id = :'pur_id'), 'a cash purchase is paid at once');
update public.purchases set subtotal = 1 where id = :'pur_id';
select is((select subtotal from public.purchases where id = :'pur_id'), 100.00::numeric, 'subtotal cannot be set by hand');
select throws_ok($$insert into public.purchases (tenant_id, outlet_id, payment_mode)
  values ('10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', 'cash')$$,
  '42501', null, 'Baner manager cannot record purchases for KP');

insert into public.purchases (tenant_id, outlet_id, vendor_name, payment_mode)
values (:brew, :baner, 'Veg Market', 'credit') returning id \gset cred_
insert into public.purchase_items (tenant_id, purchase_id, item_name, quantity, unit, rate) values
  (:brew, :'cred_id', 'Tomato', 5, 'kg', 30);
select ok((select paid_at is null from public.purchases where id = :'cred_id'), 'a credit purchase starts unpaid');
select is((public.purchases_summary(:brew, private.tenant_today(:brew), private.tenant_today(:brew)) ->> 'unpaid')::numeric
          - (select coalesce(sum(total), 0) from public.purchases
             where tenant_id = :brew and purchase_date = private.tenant_today(:brew) and paid_at is null and id <> :'cred_id'),
  150.00::numeric, 'summary counts what is still owed (other data in the DB aside)');
select pg_temp.logout();

-- ---- Day close: cash out comes off the expected cash ---------------------------------------------
-- In one test transaction now() never moves, so put the morning's dairy purchase before the day opens.
update public.purchases set paid_at = now() - interval '1 hour' where id = :'pur_id';
select pg_temp.login('cashier.baner@brewleaf.test');
insert into t select 'day', (public.open_day(:baner, 2000)).id;
select pg_temp.logout();

-- Things paid in cash during the open day (the purchases above were before it opened).
select pg_temp.login('manager.baner@brewleaf.test');
select lives_ok($$select public.mark_purchase_paid((select id from public.purchases where vendor_name = 'Veg Market'), 'cash')$$,
  'manager pays the credit purchase in cash');
select pg_temp.logout();
select pg_temp.login('owner@brewleaf.test');
insert into public.salary_entries (tenant_id, employee_id, kind, amount, period_month, payment_mode, outlet_id)
values (:brew, (select v from t where k = 'emp'), 'salary', 1000, '2026-10-01', 'cash', :baner);
select pg_temp.logout();
select pg_temp.login('cashier.baner@brewleaf.test');
select ok(public.record_cash_out(:baner, 'other', 'Gas cylinder delivery tip', 50) is not null, 'cashier records a pay-out');
select ok(public.record_cash_out(:baner, 'purchase', 'Bread', 80) is not null, 'cashier records a quick purchase');

select is((select count(*) from public.cash_out_for_day((select v from t where k = 'day'))), 4::bigint,
  'four cash payments today: credit paid, staff, tip, bread');
select is((select label from public.cash_out_for_day((select v from t where k = 'day')) where kind = 'staff'), 'Staff payment',
  'the cashier sees no name or pay type on staff payments');
select is((select sum(amount) from public.cash_out_for_day((select v from t where k = 'day'))), 1280.00::numeric,
  '150 + 1000 + 50 + 80');

select is((public.close_day(:baner, 700)).expected_cash, 720.00::numeric, 'expected = 2000 opening − 1280 paid out');
select is((select summary -> 'cashOutByKind' from public.day_sessions where id = (select v from t where k = 'day')),
  '{"other": 50.00, "staff": 1000.00, "purchase": 230.00}'::jsonb, 'summary splits cash out by kind');
select is((select cash_difference from public.day_sessions where id = (select v from t where k = 'day')), -20.00::numeric,
  'counted 700 against 720: short by 20');
select pg_temp.logout();

select pg_temp.login('waiter.baner@brewleaf.test');
select throws_ok($$select * from public.cash_out_for_day((select v from t where k = 'day'))$$, '42501', null,
  'waiters cannot see the cash out');
select pg_temp.logout();

select * from finish();
rollback;
