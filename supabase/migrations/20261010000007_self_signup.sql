-- Self sign-up: a restaurant owner signs up on the website, proves the email address, and only
-- then gets a business (tenant + first outlet + GST rates + owner role, 14-day trial).
--
--   website form → backend POST /public/v1/signups → public.signups row + Supabase invite email
--   → owner opens the link, sets a password on /business/welcome
--   → the page calls complete_signup() → tenant created → setup wizard
--
-- Nothing is created for an address that never confirms, so the form can't be used to fill the
-- platform with restaurants. create_tenant (Super Admin) and complete_signup share
-- private.provision_tenant.

create extension if not exists unaccent with schema extensions;

create table public.signups (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null check (length(trim(restaurant_name)) between 2 and 120),
  owner_name text check (owner_name is null or length(owner_name) <= 120),
  email citext not null,
  phone text check (phone is null or phone ~ '^\+?[0-9 ]{8,16}$'),
  city text check (city is null or length(city) <= 80),
  plan_id text not null default 'pro' references public.plans (id),
  source text,                                            -- e.g. 'website', utm campaign
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  tenant_id uuid references public.tenants (id) on delete set null
);
create index on public.signups (lower(email::text)) where completed_at is null;

-- Only the backend (service role) and Super Admin touch sign-ups.
alter table public.signups enable row level security;
revoke all on public.signups from anon, authenticated;
grant select on public.signups to authenticated;
grant all on public.signups to service_role;
create policy signups_super_admin on public.signups for select to authenticated
  using (private.is_super_admin());

-- "Brew & Leaf Café" → "brew-and-leaf-cafe", with -2, -3… when taken.
create function private.unique_slug(p_name text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  v_base text;
  v_slug text;
  v_n int := 1;
begin
  v_base := trim(both '-' from regexp_replace(
              lower(replace(extensions.unaccent(p_name), '&', ' and ')), '[^a-z0-9]+', '-', 'g'));
  v_base := left(coalesce(nullif(v_base, ''), 'restaurant'), 50);
  v_slug := v_base;
  while exists (select 1 from public.tenants t where t.slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;
  return v_slug;
end $$;

-- Tenant + first outlet + standard GST rates. Shared by create_tenant and complete_signup.
create function private.provision_tenant(
  p_name text,
  p_slug text,
  p_plan_id text,
  p_outlet_name text,
  p_city text,
  p_phone text,
  p_trial_days int
) returns table (tenant_id uuid, outlet_id uuid)
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_outlet uuid;
begin
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

  return query select v_tenant, v_outlet;
end $$;

-- Same signature and behaviour as 0004; the body now uses provision_tenant.
create or replace function public.create_tenant(
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
  v_ids record;
  v_owner text;
begin
  if not private.is_super_admin() then
    raise exception 'Super Admin only' using errcode = '42501';
  end if;
  select * into v_ids from private.provision_tenant(p_name, p_slug, p_plan_id, p_outlet_name, p_city, p_phone, p_trial_days);
  v_owner := public.invite_member(v_ids.tenant_id, p_owner_email, 'owner', null);
  return jsonb_build_object('tenant_id', v_ids.tenant_id, 'outlet_id', v_ids.outlet_id, 'owner', v_owner);
exception
  when unique_violation then
    raise exception 'The web address "%" is already taken', lower(trim(p_slug)) using errcode = '23505';
end $$;

-- Called by the signed-in owner after confirming the email (the invite link). Creates the
-- business from their latest pending sign-up; returns null when there is nothing to complete,
-- so the welcome page can call it for every new account.
create function public.complete_signup() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user auth.users;
  v_signup public.signups;
  v_ids record;
begin
  select * into v_user from auth.users u where u.id = auth.uid();
  if v_user.id is null then
    raise exception 'Sign in first' using errcode = '42501';
  end if;
  if v_user.email_confirmed_at is null then
    raise exception 'Open the link in your email first' using errcode = '42501';
  end if;

  select * into v_signup from public.signups s
  where lower(s.email::text) = lower(v_user.email) and s.completed_at is null
    and s.created_at > now() - interval '7 days'
  order by s.created_at desc
  limit 1
  for update;
  if v_signup.id is null then
    return null;
  end if;

  select * into v_ids from private.provision_tenant(
    v_signup.restaurant_name, private.unique_slug(v_signup.restaurant_name), v_signup.plan_id,
    null, v_signup.city, v_signup.phone, 14);

  insert into public.memberships (tenant_id, user_id, role) values (v_ids.tenant_id, v_user.id, 'owner');

  update public.tenants set email = v_user.email where id = v_ids.tenant_id;
  update public.profiles set full_name = coalesce(full_name, v_signup.owner_name), phone = coalesce(phone, v_signup.phone)
  where id = v_user.id;
  update public.signups set completed_at = now(), tenant_id = v_ids.tenant_id
  where lower(email::text) = lower(v_user.email) and completed_at is null;

  return jsonb_build_object('tenant_id', v_ids.tenant_id, 'outlet_id', v_ids.outlet_id);
end $$;

revoke execute on function public.complete_signup() from public, anon;
grant execute on function public.complete_signup() to authenticated;
