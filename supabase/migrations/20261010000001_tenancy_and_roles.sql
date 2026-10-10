-- Tenancy, roles and access helpers.
--
-- Model: plan → tenant (restaurant brand) → outlets. People sign in once (auth.users / profiles)
-- and get a role per tenant through memberships. Super Admin is a platform flag on the profile.
-- Every business table carries tenant_id; RLS policies call private.can() so one business never
-- sees another's rows, and composite foreign keys (tenant_id, id) stop a row in one tenant from
-- pointing at a row in another.

create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------

create type public.tenant_status as enum ('trial', 'active', 'past_due', 'suspended', 'cancelled');

-- Customer is not a tenant role: diners arrive with the customer side (Phase 8).
create type public.tenant_role as enum ('admin', 'owner', 'manager', 'cashier', 'waiter', 'kitchen', 'delivery');

-- ---------------------------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------------------------

create table public.plans (
  id text primary key,
  name text not null,
  price_monthly numeric(10, 2) not null check (price_monthly >= 0),
  max_outlets int check (max_outlets > 0),          -- null = unlimited
  features jsonb not null default '{}'::jsonb,       -- feature switch name → boolean
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on column public.plans.features is
  'Feature switches, e.g. {"pos": true, "kds": true, "waiter_app": false}. Tenants can override them.';

insert into public.plans (id, name, price_monthly, max_outlets, features, sort_order) values
  ('starter', 'Starter', 1499, 1,
   '{"pos": true, "kds": true, "waiter_app": false, "delivery": false, "inventory": false, "analytics": false, "multi_outlet": false}', 1),
  ('pro', 'Pro', 2999, 1,
   '{"pos": true, "kds": true, "waiter_app": true, "delivery": true, "inventory": true, "analytics": true, "multi_outlet": false}', 2),
  ('chain', 'Chain', 4999, null,
   '{"pos": true, "kds": true, "waiter_app": true, "delivery": true, "inventory": true, "analytics": true, "multi_outlet": true}', 3);

-- ---------------------------------------------------------------------------------------------
-- Tenants and outlets
-- ---------------------------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug citext not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  legal_name text,
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  fssai_number text check (fssai_number is null or fssai_number ~ '^[0-9]{14}$'),
  phone text,
  email citext,
  address text,
  logo_url text,
  prices_include_tax boolean not null default false,
  timezone text not null default 'Asia/Kolkata',
  -- Subscription (changed by Super Admin only, see guard_tenant_subscription)
  plan_id text not null default 'pro' references public.plans (id),
  status public.tenant_status not null default 'trial',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  feature_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.outlets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  address text,
  city text,
  phone text,
  gstin text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  -- Location, cached from OpenStreetMap Nominatim (backend/src/geocode) or the browser's position
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  osm_place_id bigint,
  geocoded_at timestamptz,
  is_active boolean not null default true,
  -- Running counters for order and bill numbers (maintained by triggers)
  last_order_no int not null default 0,
  last_bill_no int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);
create index on public.outlets (tenant_id);

-- ---------------------------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext,
  full_name text,
  phone text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.tenant_role not null,
  outlet_id uuid,                                     -- null = every outlet of the tenant
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade
);
create index on public.memberships (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  email citext not null,
  role public.tenant_role not null,
  outlet_id uuid,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade
);
create index on public.invitations (lower(email::text)) where accepted_at is null;
create unique index invitations_one_pending on public.invitations (tenant_id, email) where accepted_at is null;

-- ---------------------------------------------------------------------------------------------
-- Access helpers (security definer so policies can read memberships without recursion)
-- ---------------------------------------------------------------------------------------------

create function private.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_super_admin from public.profiles p where p.id = auth.uid()), false)
$$;

-- Business is open for reading (trial, active, past_due) or for writing (also: trial not expired).
create function private.tenant_open(p_tenant uuid, p_write boolean) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenants t
    where t.id = p_tenant
      and case when p_write
               then t.status in ('active', 'past_due') or (t.status = 'trial' and t.trial_ends_at > now())
               else t.status in ('trial', 'active', 'past_due') end)
$$;

-- The one check every policy uses: does the current user hold one of p_roles in p_tenant,
-- for outlet p_outlet (null = tenant-level row), while the business is open?
-- Super Admin passes everything (support and assisted onboarding).
create function private.can(
  p_tenant uuid,
  p_roles public.tenant_role[],
  p_outlet uuid default null,
  p_write boolean default false
) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_super_admin() or (
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid()
        and m.tenant_id = p_tenant
        and m.is_active
        and m.role = any (p_roles)
        and (p_outlet is null or m.outlet_id is null or m.outlet_id = p_outlet))
    and private.tenant_open(p_tenant, p_write))
$$;

create function private.all_roles() returns public.tenant_role[]
language sql immutable as $$ select enum_range(null::public.tenant_role) $$;

grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Generic triggers
-- ---------------------------------------------------------------------------------------------

create function private.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- A row never moves to another tenant.
create function private.keep_tenant() returns trigger
language plpgsql as $$
begin
  if new.tenant_id is distinct from old.tenant_id then
    raise exception 'tenant_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger touch before update on public.tenants for each row execute function private.touch_updated_at();
create trigger touch before update on public.outlets for each row execute function private.touch_updated_at();
create trigger keep_tenant before update on public.outlets for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.memberships for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.invitations for each row execute function private.keep_tenant();

-- Plan limit on outlets.
create function private.check_outlet_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_max int;
  v_count int;
begin
  select p.max_outlets into v_max
  from public.tenants t join public.plans p on p.id = t.plan_id
  where t.id = new.tenant_id;

  select count(*) into v_count from public.outlets o where o.tenant_id = new.tenant_id;

  if v_max is not null and v_count >= v_max then
    raise exception 'Your plan allows % outlet(s). Upgrade to add more.', v_max using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger outlet_limit before insert on public.outlets for each row execute function private.check_outlet_limit();

-- Membership rules: nobody edits their own membership, only Admin (or Super Admin) hands out or
-- touches the Admin role, and owners/admins are the only ones who manage staff (enforced by RLS).
create function private.guard_membership() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_target public.memberships := coalesce(new, old);
begin
  if v_uid is null or private.is_super_admin() then
    return coalesce(new, old);                        -- service role, migrations, Super Admin
  end if;

  if tg_op <> 'INSERT' and old.user_id = v_uid then
    raise exception 'You cannot change your own role' using errcode = '42501';
  end if;

  if (tg_op <> 'INSERT' and old.role = 'admin') or (tg_op <> 'DELETE' and new.role = 'admin') then
    if not private.can(v_target.tenant_id, '{admin}', null, true) then
      raise exception 'Only an Admin can manage Admin members' using errcode = '42501';
    end if;
  end if;

  return coalesce(new, old);
end $$;

create trigger guard before insert or update or delete on public.memberships
  for each row execute function private.guard_membership();

-- New auth user → profile, and pending invitations for that email become memberships.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name', new.phone)
  on conflict (id) do nothing;

  insert into public.memberships (tenant_id, user_id, role, outlet_id)
  select i.tenant_id, new.id, i.role, i.outlet_id
  from public.invitations i
  where lower(i.email::text) = lower(new.email) and i.accepted_at is null and i.expires_at > now()
  on conflict (tenant_id, user_id) do nothing;

  update public.invitations
  set accepted_at = now()
  where lower(email::text) = lower(new.email) and accepted_at is null and expires_at > now();

  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------

alter table public.plans enable row level security;
alter table public.tenants enable row level security;
alter table public.outlets enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

-- Table privileges are granted explicitly (newer Supabase stacks grant nothing by default);
-- RLS policies below decide which rows. Nothing here is public until the customer side (Phase 8).
grant select, insert, update, delete on public.plans, public.tenants, public.outlets, public.profiles,
  public.memberships, public.invitations to authenticated;
grant all on public.plans, public.tenants, public.outlets, public.profiles, public.memberships,
  public.invitations to service_role;
revoke all on public.plans, public.tenants, public.outlets, public.profiles, public.memberships,
  public.invitations from anon;

-- Plans: everyone signed in can read; Super Admin edits.
create policy plans_read on public.plans for select to authenticated using (true);
create policy plans_write on public.plans for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- Tenants: members read their own; owners/admins edit business details; Super Admin does the rest.
create policy tenants_read on public.tenants for select to authenticated
  using (private.can(id, private.all_roles()));
create policy tenants_update on public.tenants for update to authenticated
  using (private.can(id, '{admin,owner}', null, true))
  with check (private.can(id, '{admin,owner}', null, true));
create policy tenants_insert on public.tenants for insert to authenticated
  with check (private.is_super_admin());
create policy tenants_delete on public.tenants for delete to authenticated
  using (private.is_super_admin());

-- Subscription fields (plan, status, trial, feature switches, slug) stay with Super Admin.
create function private.guard_tenant_subscription() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not private.is_super_admin() and (
       new.plan_id is distinct from old.plan_id or new.status is distinct from old.status
    or new.trial_ends_at is distinct from old.trial_ends_at
    or new.feature_overrides is distinct from old.feature_overrides
    or new.slug is distinct from old.slug) then
    raise exception 'Only Super Admin can change the subscription' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger guard_subscription before update on public.tenants
  for each row execute function private.guard_tenant_subscription();

-- Internal sales/support notes about a tenant: Super Admin only.
create table public.tenant_notes (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.tenant_notes enable row level security;
grant select, insert, update, delete on public.tenant_notes to authenticated;
grant all on public.tenant_notes to service_role;
revoke all on public.tenant_notes from anon;
create policy tenant_notes_super on public.tenant_notes for all to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- Outlets: staff read; owners/admins manage.
create policy outlets_read on public.outlets for select to authenticated
  using (private.can(tenant_id, private.all_roles(), id));
create policy outlets_write on public.outlets for all to authenticated
  using (private.can(tenant_id, '{admin,owner}', null, true))
  with check (private.can(tenant_id, '{admin,owner}', null, true));

-- Order/bill counters are trigger-maintained.
revoke update on public.outlets from authenticated;
grant update (name, address, city, phone, gstin, latitude, longitude, osm_place_id, geocoded_at, is_active)
  on public.outlets to authenticated;

-- Profiles: you, your co-workers (if you manage staff), and Super Admin.
create policy profiles_self on public.profiles for select to authenticated
  using (id = auth.uid() or private.is_super_admin() or exists (
    select 1 from public.memberships m
    where m.user_id = profiles.id and private.can(m.tenant_id, '{admin,owner,manager}')));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Memberships: you see your own; managers see the team; owners/admins manage it.
create policy memberships_read on public.memberships for select to authenticated
  using (user_id = auth.uid() or private.can(tenant_id, '{admin,owner,manager}'));
create policy memberships_write on public.memberships for all to authenticated
  using (private.can(tenant_id, '{admin,owner}', null, true))
  with check (private.can(tenant_id, '{admin,owner}', null, true));

-- Invitations: owners/admins.
create policy invitations_read on public.invitations for select to authenticated
  using (private.can(tenant_id, '{admin,owner}'));
create policy invitations_delete on public.invitations for delete to authenticated
  using (private.can(tenant_id, '{admin,owner}', null, true));
-- Inserts go through invite_member() so the role rules live in one place.

-- ---------------------------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------------------------

-- Effective feature switches: plan features overlaid with the tenant's overrides.
create function public.tenant_features(p_tenant uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select p.features || t.feature_overrides
  from public.tenants t join public.plans p on p.id = t.plan_id
  where t.id = p_tenant and private.can(t.id, private.all_roles())
$$;

-- Everything the console needs after sign-in to choose a workspace and build the menu.
create function public.my_workspaces() returns table (
  tenant_id uuid,
  tenant_name text,
  tenant_slug text,
  role public.tenant_role,
  outlet_id uuid,
  status public.tenant_status,
  trial_ends_at timestamptz,
  plan_id text,
  features jsonb,
  writable boolean
)
language sql stable security definer set search_path = '' as $$
  select t.id, t.name, t.slug::text, m.role, m.outlet_id, t.status, t.trial_ends_at, t.plan_id,
         p.features || t.feature_overrides, private.tenant_open(t.id, true)
  from public.memberships m
  join public.tenants t on t.id = m.tenant_id
  join public.plans p on p.id = t.plan_id
  where m.user_id = auth.uid() and m.is_active and t.status not in ('suspended', 'cancelled')
  order by t.name
$$;

create function public.am_i_super_admin() returns boolean
language sql stable as $$ select private.is_super_admin() $$;

-- Add a person to a business. Existing account → membership now; new email → pending invitation
-- that turns into a membership when the account is created (the API then sends the invite email).
create function public.invite_member(
  p_tenant uuid,
  p_email text,
  p_role public.tenant_role,
  p_outlet uuid default null
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
  v_email text := lower(trim(p_email));
begin
  if not private.can(p_tenant, '{admin,owner}', null, true) then
    raise exception 'Only an owner or admin can invite staff' using errcode = '42501';
  end if;
  if p_role = 'admin' and not private.can(p_tenant, '{admin}', null, true) then
    raise exception 'Only an Admin can invite another Admin' using errcode = '42501';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if p_outlet is not null and not exists (
       select 1 from public.outlets o where o.id = p_outlet and o.tenant_id = p_tenant) then
    raise exception 'Outlet does not belong to this business' using errcode = '22023';
  end if;

  select u.id into v_user from auth.users u where lower(u.email) = v_email;

  if v_user is not null then
    if exists (select 1 from public.memberships m where m.tenant_id = p_tenant and m.user_id = v_user) then
      return 'already_member';
    end if;
    insert into public.memberships (tenant_id, user_id, role, outlet_id)
    values (p_tenant, v_user, p_role, p_outlet);
    return 'added';
  end if;

  insert into public.invitations (tenant_id, email, role, outlet_id, invited_by)
  values (p_tenant, v_email, p_role, p_outlet, auth.uid())
  on conflict (tenant_id, email) where accepted_at is null
  do update set role = excluded.role, outlet_id = excluded.outlet_id,
                invited_by = excluded.invited_by, expires_at = now() + interval '7 days';
  return 'invited';
end $$;

grant execute on function public.tenant_features(uuid), public.my_workspaces(), public.am_i_super_admin(),
  public.invite_member(uuid, text, public.tenant_role, uuid) to authenticated;
revoke execute on function public.tenant_features(uuid), public.my_workspaces(), public.am_i_super_admin(),
  public.invite_member(uuid, text, public.tenant_role, uuid) from anon, public;

-- Push a pending invitation's expiry out another 7 days (before the API resends the email).
create function public.renew_invitation(p_invitation uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
begin
  select tenant_id into v_tenant from public.invitations where id = p_invitation and accepted_at is null;
  if v_tenant is null or not private.can(v_tenant, '{admin,owner}', null, true) then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  update public.invitations set expires_at = now() + interval '7 days' where id = p_invitation;
end $$;

revoke execute on function public.renew_invitation(uuid) from anon, public;
grant execute on function public.renew_invitation(uuid) to authenticated;
