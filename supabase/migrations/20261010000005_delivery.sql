-- Own-rider delivery (Phase 5a). Design: docs/DELIVERY.md.
--
-- A rider is a person with a 'delivery' membership in the tenant (invited like any staff member)
-- plus a rider profile that Super Admin verifies. The membership's outlet_id decides which outlets
-- the rider works for (null = every outlet).
-- Each delivery order gets delivery jobs: the cashier assigns one to a rider, the rider accepts,
-- moves it through the steps and finishes it with the customer's OTP or a photo. Every step is
-- written to delivery_events. A failed or cancelled job can be followed by a new attempt.
-- All writes go through the RPCs at the bottom, so the status rules live in one place.
-- Third-party partners (Phase 5b) will add a 'partner' mode to delivery_jobs later.

-- ---------------------------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------------------------

create type public.rider_verification as enum ('pending', 'verified', 'rejected');
create type public.vehicle_type as enum ('bicycle', 'scooter', 'motorcycle', 'ev_scooter', 'on_foot');
create type public.delivery_status as enum (
  'offered', 'assigned', 'at_pickup', 'picked_up', 'at_drop', 'delivered', 'failed', 'cancelled');

-- ---------------------------------------------------------------------------------------------
-- Delivery details on orders
-- ---------------------------------------------------------------------------------------------

alter table public.orders
  add column delivery_address text,
  add column delivery_lat numeric(9, 6) check (delivery_lat between -90 and 90),
  add column delivery_lng numeric(9, 6) check (delivery_lng between -180 and 180),
  add column delivery_charge numeric(10, 2) not null default 0 check (delivery_charge >= 0),
  add column cash_on_delivery boolean not null default false;

-- ---------------------------------------------------------------------------------------------
-- Riders
-- ---------------------------------------------------------------------------------------------

create table public.riders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  vehicle_type public.vehicle_type not null default 'scooter',
  vehicle_number text,
  licence_number text,
  photo_url text,
  licence_url text,
  id_proof_url text,
  upi_id text,
  verification public.rider_verification not null default 'pending',
  rejection_reason text,
  verified_at timestamptz,
  is_active boolean not null default true,              -- owner can block a rider
  is_online boolean not null default false,
  last_lat numeric(9, 6),
  last_lng numeric(9, 6),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, user_id)
);
create index on public.riders (user_id);

create table public.delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  order_id uuid not null,
  rider_id uuid not null,
  attempt_no int not null default 1,
  status public.delivery_status not null default 'offered',
  cod_amount numeric(12, 2) not null default 0 check (cod_amount >= 0),
  cod_collected numeric(12, 2) check (cod_collected >= 0),
  otp_hash text,
  proof_photo_url text,
  reason text,                                           -- reject, fail or cancel reason
  assigned_by uuid references public.profiles (id) on delete set null,
  offered_at timestamptz not null default now(),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  finished_at timestamptz,                               -- delivered, failed or cancelled
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (order_id, attempt_no),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, order_id) references public.orders (tenant_id, id) on delete cascade,
  foreign key (tenant_id, rider_id) references public.riders (tenant_id, id)
);
create unique index delivery_jobs_one_open_per_order on public.delivery_jobs (order_id)
  where status not in ('delivered', 'failed', 'cancelled');
create index on public.delivery_jobs (rider_id, status);
create index on public.delivery_jobs (tenant_id, outlet_id, created_at desc);

create table public.delivery_events (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  job_id uuid not null,
  status public.delivery_status not null,
  actor_id uuid references public.profiles (id) on delete set null,
  lat numeric(9, 6),
  lng numeric(9, 6),
  note text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, job_id) references public.delivery_jobs (tenant_id, id) on delete cascade
);
create index on public.delivery_events (job_id, created_at);

-- Location trail while online. Kept 30 days (see private.prune_rider_locations).
create table public.rider_locations (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  rider_id uuid not null,
  job_id uuid,
  lat numeric(9, 6) not null check (lat between -90 and 90),
  lng numeric(9, 6) not null check (lng between -180 and 180),
  recorded_at timestamptz not null default now(),
  foreign key (tenant_id, rider_id) references public.riders (tenant_id, id) on delete cascade,
  foreign key (tenant_id, job_id) references public.delivery_jobs (tenant_id, id) on delete set null (job_id)
);
create index on public.rider_locations (rider_id, recorded_at desc);

-- Cash on delivery handed in by a rider at day close.
create table public.cod_settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  rider_id uuid not null,
  business_date date not null,
  expected numeric(12, 2) not null,
  handed_in numeric(12, 2) not null check (handed_in >= 0),
  difference numeric(12, 2) generated always as (handed_in - expected) stored,
  note text,
  settled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (outlet_id, rider_id, business_date),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, rider_id) references public.riders (tenant_id, id)
);

-- ---------------------------------------------------------------------------------------------
-- Helpers and triggers
-- ---------------------------------------------------------------------------------------------

create trigger touch before update on public.riders for each row execute function private.touch_updated_at();
create trigger touch before update on public.delivery_jobs for each row execute function private.touch_updated_at();
create trigger keep_tenant before update on public.riders for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.delivery_jobs for each row execute function private.keep_tenant();

-- The current user's rider row in a tenant (null if they are not a rider there).
create function private.my_rider(p_tenant uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select r.id from public.riders r where r.tenant_id = p_tenant and r.user_id = auth.uid()
$$;

-- Is the current user the rider on this job?
create function private.is_job_rider(p_job uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.delivery_jobs j join public.riders r on r.id = j.rider_id
    where j.id = p_job and r.user_id = auth.uid())
$$;

-- Verification fields stay with Super Admin; riders edit only their own details.
create function private.guard_rider() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or private.is_super_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.verification := 'pending';
    new.rejection_reason := null;
    new.verified_at := null;
    new.is_online := false;
    return new;
  end if;
  if (new.verification, new.rejection_reason, new.verified_at)
     is distinct from (old.verification, old.rejection_reason, old.verified_at) then
    raise exception 'Only Super Admin can verify riders' using errcode = '42501';
  end if;
  if new.user_id is distinct from old.user_id then
    raise exception 'A rider profile cannot move to another person' using errcode = '42501';
  end if;
  -- Changing documents sends the rider back for verification.
  if (new.licence_url, new.id_proof_url, new.licence_number, new.vehicle_number)
     is distinct from (old.licence_url, old.id_proof_url, old.licence_number, old.vehicle_number) then
    new.verification := 'pending';
    new.verified_at := null;
  end if;
  return new;
end $$;

create trigger guard before insert or update on public.riders
  for each row execute function private.guard_rider();

-- Every status change is logged.
create function private.log_delivery_event() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.delivery_events (tenant_id, job_id, status, actor_id, lat, lng, note)
    values (new.tenant_id, new.id, new.status, auth.uid(),
            nullif(current_setting('private.event_lat', true), '')::numeric,
            nullif(current_setting('private.event_lng', true), '')::numeric,
            case when new.status in ('failed', 'cancelled') or (tg_op = 'UPDATE' and old.status = 'offered')
                 then new.reason end);
  end if;
  return null;
end $$;

create trigger log_event after insert or update on public.delivery_jobs
  for each row execute function private.log_delivery_event();

create function private.set_event_location(p_lat numeric, p_lng numeric) returns void
language sql as $$
  select set_config('private.event_lat', coalesce(p_lat::text, ''), true),
         set_config('private.event_lng', coalesce(p_lng::text, ''), true);
$$;

create function private.prune_rider_locations() returns void
language sql security definer set search_path = '' as $$
  delete from public.rider_locations where recorded_at < now() - interval '30 days'
$$;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security (reads only; writes go through the RPCs below)
-- ---------------------------------------------------------------------------------------------

alter table public.riders enable row level security;
alter table public.delivery_jobs enable row level security;
alter table public.delivery_events enable row level security;
alter table public.rider_locations enable row level security;
alter table public.cod_settlements enable row level security;
-- Explicit grants: new tables are not exposed to the API roles automatically.
revoke all on public.riders, public.delivery_jobs, public.delivery_events, public.rider_locations,
  public.cod_settlements from anon, authenticated;
grant select, insert on public.riders to authenticated;
grant select on public.delivery_events, public.rider_locations, public.cod_settlements to authenticated;
grant all on public.riders, public.delivery_jobs, public.delivery_events, public.rider_locations,
  public.cod_settlements to service_role;

-- Riders: the rider, and cashiers or above in the tenant (outlet-level staff see every rider of
-- the tenant, since one rider can serve several outlets).
create policy riders_read on public.riders for select to authenticated
  using (user_id = auth.uid() or private.can(tenant_id, '{admin,owner,manager,cashier}'));
-- A delivery member creates their own profile once.
create policy riders_insert_self on public.riders for insert to authenticated
  with check (user_id = auth.uid() and private.can(tenant_id, '{delivery}', null, true));
create policy riders_update on public.riders for update to authenticated
  using (user_id = auth.uid() or private.can(tenant_id, '{admin,owner}', null, true))
  with check (user_id = auth.uid() or private.can(tenant_id, '{admin,owner}', null, true));
revoke update on public.riders from authenticated;
grant update (full_name, phone, vehicle_type, vehicle_number, licence_number, photo_url, licence_url,
  id_proof_url, upi_id, is_active) on public.riders to authenticated;
-- Riders cannot unblock themselves.
create function private.guard_rider_block() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and new.is_active is distinct from old.is_active
     and not private.can(new.tenant_id, '{admin,owner}', null, true) then
    raise exception 'Only the owner can block or unblock a rider' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger guard_block before update on public.riders
  for each row execute function private.guard_rider_block();

-- Jobs: staff of the outlet, and the rider on the job.
create policy delivery_jobs_read on public.delivery_jobs for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier,kitchen}', outlet_id)
         or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));
-- The OTP hash never leaves the database (a column revoke alone would not override the table grant).
revoke select on public.delivery_jobs from authenticated;
grant select (id, tenant_id, outlet_id, order_id, rider_id, attempt_no, status, cod_amount, cod_collected,
  proof_photo_url, reason, assigned_by, offered_at, accepted_at, picked_up_at, finished_at, created_at,
  updated_at) on public.delivery_jobs to authenticated;

create policy delivery_events_read on public.delivery_events for select to authenticated
  using (exists (select 1 from public.delivery_jobs j where j.id = job_id));

create policy rider_locations_read on public.rider_locations for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier}')
         or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));

create policy cod_settlements_read on public.cod_settlements for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier}', outlet_id)
         or exists (select 1 from public.riders r where r.id = rider_id and r.user_id = auth.uid()));

-- orders_read leaves out the delivery role on purpose; riders get what they need about the order
-- (customer, address, items) through my_deliveries() below, and only while the job is open.

-- ---------------------------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------------------------

-- Cashier: give a delivery order to a rider. Returns the job id and the 4-digit OTP for the
-- customer (shown once; only its hash is stored).
create function public.assign_delivery(p_order uuid, p_rider uuid)
returns table (job_id uuid, otp text)
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_rider public.riders;
  v_attempt int;
  v_otp text := lpad((floor(random() * 10000))::int::text, 4, '0');
  v_job uuid;
begin
  select * into v_order from public.orders where id = p_order;
  if v_order.id is null
     or not private.can(v_order.tenant_id, '{admin,owner,manager,cashier}', v_order.outlet_id, true) then
    raise exception 'Order not found' using errcode = '42501';
  end if;
  if v_order.type <> 'delivery' then
    raise exception 'Order #% is not a delivery order', v_order.order_no using errcode = 'P0001';
  end if;
  if v_order.status in ('delivered', 'cancelled') then
    raise exception 'Order #% is already %', v_order.order_no, v_order.status using errcode = 'P0001';
  end if;
  if coalesce(trim(v_order.delivery_address), '') = '' then
    raise exception 'Add the delivery address first' using errcode = '22023';
  end if;

  select * into v_rider from public.riders where id = p_rider and tenant_id = v_order.tenant_id;
  if v_rider.id is null then
    raise exception 'Rider not found' using errcode = '22023';
  end if;
  if v_rider.verification <> 'verified' or not v_rider.is_active then
    raise exception '% is not verified or is blocked', v_rider.full_name using errcode = 'P0001';
  end if;
  if not exists (
       select 1 from public.memberships m
       where m.tenant_id = v_order.tenant_id and m.user_id = v_rider.user_id and m.role = 'delivery'
         and m.is_active and (m.outlet_id is null or m.outlet_id = v_order.outlet_id)) then
    raise exception '% does not deliver for this outlet', v_rider.full_name using errcode = 'P0001';
  end if;

  select coalesce(max(attempt_no), 0) + 1 into v_attempt from public.delivery_jobs where order_id = p_order;

  insert into public.delivery_jobs (tenant_id, outlet_id, order_id, rider_id, attempt_no, cod_amount,
                                    otp_hash, assigned_by)
  values (v_order.tenant_id, v_order.outlet_id, p_order, p_rider, v_attempt,
          case when v_order.cash_on_delivery then v_order.total + v_order.delivery_charge else 0 end,
          extensions.crypt(v_otp, extensions.gen_salt('bf')), auth.uid())
  returning id into v_job;

  return query select v_job, v_otp;
exception
  when unique_violation then
    raise exception 'Order #% already has a rider on the way', v_order.order_no using errcode = 'P0001';
end $$;

-- Rider: accept or reject an offer.
create function public.respond_to_delivery(p_job uuid, p_accept boolean, p_reason text default null)
returns public.delivery_status
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.delivery_jobs;
begin
  if not private.is_job_rider(p_job) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  select * into v_job from public.delivery_jobs where id = p_job for update;
  if v_job.status <> 'offered' then
    raise exception 'This job is already %', v_job.status using errcode = 'P0001';
  end if;
  if not private.tenant_open(v_job.tenant_id, true) then
    raise exception 'This business is not active' using errcode = '42501';
  end if;

  update public.delivery_jobs set
    status = case when p_accept then 'assigned' else 'cancelled' end::public.delivery_status,
    accepted_at = case when p_accept then now() end,
    finished_at = case when p_accept then null else now() end,
    reason = case when p_accept then null else coalesce(nullif(trim(p_reason), ''), 'Rejected by rider') end
  where id = p_job
  returning status into v_job.status;
  return v_job.status;
end $$;

-- Rider: next step on the way (at_pickup → picked_up → at_drop). Finishing uses complete_delivery.
create function public.advance_delivery(p_job uuid, p_status public.delivery_status,
                                        p_lat numeric default null, p_lng numeric default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.delivery_jobs;
  v_rank constant jsonb := '{"assigned": 0, "at_pickup": 1, "picked_up": 2, "at_drop": 3}';
begin
  if not private.is_job_rider(p_job) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  if p_status not in ('at_pickup', 'picked_up', 'at_drop') then
    raise exception 'Use complete_delivery or fail_delivery to finish a job' using errcode = '22023';
  end if;
  select * into v_job from public.delivery_jobs where id = p_job for update;
  if v_job.status not in ('assigned', 'at_pickup', 'picked_up', 'at_drop') then
    raise exception 'This job is %', v_job.status using errcode = 'P0001';
  end if;
  if (v_rank ->> p_status::text)::int <= (v_rank ->> v_job.status::text)::int then
    raise exception 'Job cannot go back from % to %', v_job.status, p_status using errcode = 'P0001';
  end if;

  perform private.set_event_location(p_lat, p_lng);
  update public.delivery_jobs set
    status = p_status,
    picked_up_at = case when p_status in ('picked_up', 'at_drop') then coalesce(picked_up_at, now()) else picked_up_at end
  where id = p_job;
end $$;

-- Rider: delivered. Needs the customer's OTP, or a photo when the customer has no OTP.
-- For cash on delivery, the amount actually collected.
create function public.complete_delivery(p_job uuid, p_otp text default null, p_photo_url text default null,
                                         p_cod_collected numeric default null,
                                         p_lat numeric default null, p_lng numeric default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.delivery_jobs;
begin
  if not private.is_job_rider(p_job) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  select * into v_job from public.delivery_jobs where id = p_job for update;
  if v_job.status not in ('picked_up', 'at_drop') then
    raise exception 'Pick up the order before delivering it' using errcode = 'P0001';
  end if;
  if p_otp is not null then
    if v_job.otp_hash is null or extensions.crypt(p_otp, v_job.otp_hash) <> v_job.otp_hash then
      raise exception 'Wrong OTP' using errcode = '22023';
    end if;
  elsif coalesce(trim(p_photo_url), '') = '' then
    raise exception 'Enter the customer''s OTP or take a photo' using errcode = '22023';
  end if;
  if v_job.cod_amount > 0 and p_cod_collected is null then
    raise exception 'Enter the cash collected' using errcode = '22023';
  end if;

  perform private.set_event_location(p_lat, p_lng);
  update public.delivery_jobs set
    status = 'delivered',
    proof_photo_url = nullif(trim(p_photo_url), ''),
    cod_collected = case when v_job.cod_amount > 0 then p_cod_collected end,
    reason = case when v_job.cod_amount > 0 and p_cod_collected <> v_job.cod_amount
                  then 'Cash collected differs from the amount due' end,
    finished_at = now()
  where id = p_job;

  update public.orders set status = 'delivered' where id = v_job.order_id and status <> 'delivered';
end $$;

-- Rider: could not deliver (customer unreachable, wrong address, refused). The order stays open
-- so the cashier can assign it again or cancel it.
create function public.fail_delivery(p_job uuid, p_reason text, p_photo_url text default null,
                                     p_lat numeric default null, p_lng numeric default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.delivery_jobs;
begin
  if not private.is_job_rider(p_job) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Give a reason' using errcode = '22023';
  end if;
  select * into v_job from public.delivery_jobs where id = p_job for update;
  if v_job.status not in ('assigned', 'at_pickup', 'picked_up', 'at_drop') then
    raise exception 'This job is %', v_job.status using errcode = 'P0001';
  end if;

  perform private.set_event_location(p_lat, p_lng);
  update public.delivery_jobs set status = 'failed', reason = trim(p_reason),
    proof_photo_url = nullif(trim(p_photo_url), ''), finished_at = now()
  where id = p_job;
end $$;

-- Cashier: take the job back from the rider (to reassign it or cancel the order).
create function public.cancel_delivery(p_job uuid, p_reason text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_job public.delivery_jobs;
begin
  select * into v_job from public.delivery_jobs where id = p_job for update;
  if v_job.id is null
     or not private.can(v_job.tenant_id, '{admin,owner,manager,cashier}', v_job.outlet_id, true) then
    raise exception 'Job not found' using errcode = '42501';
  end if;
  if v_job.status in ('delivered', 'failed', 'cancelled') then
    raise exception 'This job is already %', v_job.status using errcode = 'P0001';
  end if;
  update public.delivery_jobs set status = 'cancelled',
    reason = coalesce(nullif(trim(p_reason), ''), 'Cancelled by restaurant'), finished_at = now()
  where id = p_job;
end $$;

-- Rider: go online or offline in a tenant.
create function public.set_rider_online(p_tenant uuid, p_online boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_rider uuid := private.my_rider(p_tenant);
begin
  if v_rider is null or not private.can(p_tenant, '{delivery}', null, true) then
    raise exception 'You are not a rider for this business' using errcode = '42501';
  end if;
  if p_online and not exists (
       select 1 from public.riders where id = v_rider and verification = 'verified' and is_active) then
    raise exception 'Your profile is not verified yet' using errcode = 'P0001';
  end if;
  update public.riders set is_online = p_online, last_seen_at = now() where id = v_rider;
end $$;

-- Rider: report location (every ~10 s on a job, ~60 s idle). Only stored while online.
create function public.report_rider_location(p_tenant uuid, p_lat numeric, p_lng numeric,
                                             p_job uuid default null)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_rider uuid := private.my_rider(p_tenant);
begin
  if v_rider is null then
    raise exception 'You are not a rider for this business' using errcode = '42501';
  end if;
  if not exists (select 1 from public.riders where id = v_rider and is_online) then
    return;
  end if;
  if p_job is not null and not exists (
       select 1 from public.delivery_jobs where id = p_job and rider_id = v_rider) then
    p_job := null;
  end if;
  update public.riders set last_lat = p_lat, last_lng = p_lng, last_seen_at = now() where id = v_rider;
  insert into public.rider_locations (tenant_id, rider_id, job_id, lat, lng)
  values (p_tenant, v_rider, p_job, p_lat, p_lng);
end $$;

-- Super Admin: verify or reject a rider's documents.
create function public.verify_rider(p_rider uuid, p_approve boolean, p_reason text default null)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_super_admin() then
    raise exception 'Super Admin only' using errcode = '42501';
  end if;
  if not p_approve and coalesce(trim(p_reason), '') = '' then
    raise exception 'Give a reason for rejecting' using errcode = '22023';
  end if;
  update public.riders set
    verification = case when p_approve then 'verified' else 'rejected' end::public.rider_verification,
    rejection_reason = case when p_approve then null else trim(p_reason) end,
    verified_at = case when p_approve then now() end,
    is_online = case when p_approve then is_online else false end
  where id = p_rider;
  if not found then
    raise exception 'Rider not found' using errcode = '22023';
  end if;
end $$;

-- Cashier, day close: cash each rider owes for the outlet and date (business time zone).
create function public.cod_due(p_outlet uuid, p_date date)
returns table (rider_id uuid, rider_name text, deliveries bigint, expected numeric, settled boolean)
language sql stable security definer set search_path = '' as $$
  select r.id, r.full_name, count(*), coalesce(sum(j.cod_collected), 0),
         exists (select 1 from public.cod_settlements s
                 where s.outlet_id = p_outlet and s.rider_id = r.id and s.business_date = p_date)
  from public.delivery_jobs j
  join public.riders r on r.id = j.rider_id
  join public.tenants t on t.id = j.tenant_id
  where j.outlet_id = p_outlet and j.status = 'delivered' and j.cod_collected > 0
    and (j.finished_at at time zone t.timezone)::date = p_date
    and private.can(j.tenant_id, '{admin,owner,manager,cashier}', j.outlet_id)
  group by r.id, r.full_name
  order by r.full_name
$$;

create function public.settle_cod(p_outlet uuid, p_rider uuid, p_date date, p_handed_in numeric,
                                  p_note text default null)
returns public.cod_settlements
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_expected numeric;
  v_row public.cod_settlements;
begin
  select tenant_id into v_tenant from public.outlets where id = p_outlet;
  if v_tenant is null or not private.can(v_tenant, '{admin,owner,manager,cashier}', p_outlet, true) then
    raise exception 'Outlet not found' using errcode = '42501';
  end if;
  select d.expected into v_expected from public.cod_due(p_outlet, p_date) d where d.rider_id = p_rider;

  insert into public.cod_settlements (tenant_id, outlet_id, rider_id, business_date, expected, handed_in,
                                      note, settled_by)
  values (v_tenant, p_outlet, p_rider, p_date, coalesce(v_expected, 0), p_handed_in,
          nullif(trim(p_note), ''), auth.uid())
  returning * into v_row;
  return v_row;
exception
  when unique_violation then
    raise exception 'Cash for this rider and day is already settled' using errcode = '23505';
end $$;

-- Rider app home: the rider's jobs with the order details. Customer contact and address are only
-- returned while the job is open; finished jobs show amounts and times for the earnings screen.
create function public.my_deliveries(p_tenant uuid, p_open_only boolean default true)
returns table (
  job_id uuid, status public.delivery_status, attempt_no int, offered_at timestamptz,
  accepted_at timestamptz, finished_at timestamptz, cod_amount numeric, cod_collected numeric,
  outlet_id uuid, outlet_name text, outlet_address text, outlet_phone text,
  order_id uuid, order_no int, customer_name text, customer_phone text, delivery_address text,
  delivery_lat numeric, delivery_lng numeric, order_notes text, order_total numeric, items jsonb
)
language sql stable security definer set search_path = '' as $$
  select j.id, j.status, j.attempt_no, j.offered_at, j.accepted_at, j.finished_at, j.cod_amount, j.cod_collected,
         ou.id, ou.name, ou.address, ou.phone,
         o.id, o.order_no,
         case when j.finished_at is null then o.customer_name end,
         case when j.finished_at is null then o.customer_phone end,
         case when j.finished_at is null then o.delivery_address end,
         case when j.finished_at is null then o.delivery_lat end,
         case when j.finished_at is null then o.delivery_lng end,
         case when j.finished_at is null then o.notes end,
         o.total + o.delivery_charge,
         (select coalesce(jsonb_agg(jsonb_build_object('name', i.name, 'variant', i.variant_name,
                                                       'quantity', i.quantity) order by i.created_at), '[]')
          from public.order_items i where i.order_id = o.id)
  from public.delivery_jobs j
  join public.riders r on r.id = j.rider_id
  join public.orders o on o.id = j.order_id
  join public.outlets ou on ou.id = j.outlet_id
  where j.tenant_id = p_tenant and r.user_id = auth.uid()
    and (not p_open_only or j.finished_at is null)
  order by j.offered_at desc
  limit 200
$$;

revoke execute on function public.my_deliveries(uuid, boolean) from anon, public;
grant execute on function public.my_deliveries(uuid, boolean) to authenticated;

revoke execute on function
  public.assign_delivery(uuid, uuid),
  public.respond_to_delivery(uuid, boolean, text),
  public.advance_delivery(uuid, public.delivery_status, numeric, numeric),
  public.complete_delivery(uuid, text, text, numeric, numeric, numeric),
  public.fail_delivery(uuid, text, text, numeric, numeric),
  public.cancel_delivery(uuid, text),
  public.set_rider_online(uuid, boolean),
  public.report_rider_location(uuid, numeric, numeric, uuid),
  public.verify_rider(uuid, boolean, text),
  public.cod_due(uuid, date),
  public.settle_cod(uuid, uuid, date, numeric, text)
from anon, public;
grant execute on function
  public.assign_delivery(uuid, uuid),
  public.respond_to_delivery(uuid, boolean, text),
  public.advance_delivery(uuid, public.delivery_status, numeric, numeric),
  public.complete_delivery(uuid, text, text, numeric, numeric, numeric),
  public.fail_delivery(uuid, text, text, numeric, numeric),
  public.cancel_delivery(uuid, text),
  public.set_rider_online(uuid, boolean),
  public.report_rider_location(uuid, numeric, numeric, uuid),
  public.verify_rider(uuid, boolean, text),
  public.cod_due(uuid, date),
  public.settle_cod(uuid, uuid, date, numeric, text)
to authenticated;
grant execute on all functions in schema private to authenticated;

-- Delivery board and rider app listen to job changes; the owner's map listens to riders.
alter publication supabase_realtime add table public.delivery_jobs, public.riders;
