-- Self sign-up: a business is created only after the owner confirms the email. Run with: npx supabase test db
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

-- What the backend does: a sign-up row, then an invite that creates an unconfirmed account.
insert into public.signups (restaurant_name, owner_name, email, phone, city, plan_id) values
  ('Spice Route', 'Kiran Rao', 'kiran@newcafe.test', '+91 98220 44444', 'Pune', 'starter');
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
                        created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kiran@newcafe.test',
        '', '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', '');

-- ---- Not confirmed yet ------------------------------------------------------------------------
select pg_temp.login('kiran@newcafe.test');
select throws_ok($$select public.complete_signup()$$, '42501', 'Open the link in your email first',
  'an unconfirmed email gets no business');
select is((select count(*) from public.signups), 0::bigint, 'owners cannot read sign-ups');
select pg_temp.logout();

-- ---- Confirmed: the business is created -------------------------------------------------------
update auth.users set email_confirmed_at = now() where email = 'kiran@newcafe.test';
select pg_temp.login('kiran@newcafe.test');
create temp table r as select public.complete_signup() as result;
grant select on r to authenticated;
select ok((select result ? 'tenant_id' from r), 'complete_signup returns the new tenant');

select is((select count(*) from public.my_workspaces()), 1::bigint, 'the owner has one workspace');
select is((select role::text from public.my_workspaces()), 'owner', 'as owner');
select is((select t.slug::text from public.tenants t), 'spice-route-2', 'web address from the name, -2 because the seed already has spice-route');
select is((select status::text from public.tenants), 'trial', 'starts on trial');
select ok((select trial_ends_at between now() + interval '13 days 23 hours' and now() + interval '14 days 1 hour' from public.tenants), '14-day trial');
select is((select plan_id from public.tenants), 'starter', 'plan from the sign-up');
select is((select count(*) from public.outlets), 1::bigint, 'first outlet created');
select is((select count(*) from public.tax_rates), 3::bigint, 'standard GST rates created');
select is(public.complete_signup(), null::jsonb, 'calling again does nothing');
select is((select full_name from public.profiles where email = 'kiran@newcafe.test'), 'Kiran Rao', 'owner name copied to the profile');
select pg_temp.logout();

select ok((select completed_at is not null and tenant_id is not null from public.signups where email = 'kiran@newcafe.test'),
  'sign-up marked complete');

-- ---- An existing account with no pending sign-up gets nothing --------------------------------
select pg_temp.login('waiter.baner@brewleaf.test');
select is(public.complete_signup(), null::jsonb, 'no pending sign-up, nothing created');
select pg_temp.logout();

-- ---- Super Admin create_tenant still works after the refactor ---------------------------------
select pg_temp.login('super@platform.test');
select ok((public.create_tenant('Dosa Hub', 'dosa-hub', 'owner@dosahub.test', 'pro', 'FC Road', 'Pune')) ->> 'owner' = 'invited',
  'create_tenant provisions and invites the owner');
select pg_temp.logout();

select * from finish();
rollback;
