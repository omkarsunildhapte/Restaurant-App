-- Staff operations for the POS, KDS and waiter apps (Phase 3): kitchen tickets (KOT rounds),
-- table status, split payments, day open/close, and bill numbers per financial year.
--
-- Which status is the truth:
--   kots.status   Kitchen progress of one round (new → preparing → ready → served). The KDS
--                 works on KOTs only.
--   orders.status The order's lifecycle. It follows its KOTs forward (the stage every live
--                 round has reached), but a KOT never moves an order past 'ready': a dine-in
--                 table keeps ordering rounds until it pays. Settling the bill (settle_bill)
--                 marks dine-in and takeaway orders 'served'; delivery orders finish as
--                 'delivered' in the delivery flow (0005).
--
-- How a dine-in order flows:
--   waiter adds order_items (kot_id null = not sent yet)
--   → send_kot(order) groups the unsent items into the next KOT round
--   → kitchen moves the KOT on the KDS
--   → waiter may request_bill(order); the table shows "bill requested"
--   → cashier settle_bill(order, discount, payments) inside an open day session
--   → close_day(outlet, counted cash) reconciles the drawer.

-- ---------------------------------------------------------------------------------------------
-- Types and new columns
-- ---------------------------------------------------------------------------------------------

create type public.kot_status as enum ('new', 'preparing', 'ready', 'served', 'cancelled');

alter table public.orders add column bill_requested_at timestamptz;

-- Composite keys so child rows can reference bills within the same tenant.
alter table public.bills add constraint bills_tenant_id_id_key unique (tenant_id, id);

-- Payments of a bill (one bill can be paid by several: cash + UPI, or guests paying apart).
create table public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  bill_id uuid not null,
  method public.payment_mode not null,
  amount numeric(12, 2) not null check (amount > 0),
  reference text,                                         -- UPI ref / card last 4, optional
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, bill_id) references public.bills (tenant_id, id) on delete cascade
);
create index on public.bill_payments (bill_id);

-- ---------------------------------------------------------------------------------------------
-- KOT rounds
-- ---------------------------------------------------------------------------------------------

create table public.kots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  order_id uuid not null,
  round_no int not null check (round_no > 0),
  status public.kot_status not null default 'new',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (order_id, round_no),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, order_id) references public.orders (tenant_id, id) on delete cascade
);
create index on public.kots (outlet_id, status) where status not in ('served', 'cancelled');

alter table public.order_items add column kot_id uuid;
alter table public.order_items
  add constraint order_items_kot_fk foreign key (tenant_id, kot_id) references public.kots (tenant_id, id) on delete set null (kot_id);
create index on public.order_items (kot_id);

create trigger keep_tenant before update on public.kots for each row execute function private.keep_tenant();

-- KOT changes: only the status moves, forward only; cancelling needs a cashier or above.
create function private.before_kot_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rank constant jsonb := '{"new": 0, "preparing": 1, "ready": 2, "served": 3}';
begin
  new.order_id := old.order_id;
  new.outlet_id := old.outlet_id;
  new.round_no := old.round_no;
  new.created_by := old.created_by;
  new.created_at := old.created_at;

  if new.status is distinct from old.status then
    if old.status in ('served', 'cancelled') then
      raise exception 'KOT #% is already %', old.round_no, old.status using errcode = 'P0001';
    end if;
    if new.status = 'cancelled' then
      if auth.uid() is not null
         and not private.can(new.tenant_id, '{admin,owner,manager,cashier}', new.outlet_id, true) then
        raise exception 'Only a cashier or manager can cancel a KOT' using errcode = '42501';
      end if;
    elsif (v_rank ->> new.status::text)::int <= (v_rank ->> old.status::text)::int then
      raise exception 'KOT cannot go back from % to %', old.status, new.status using errcode = 'P0001';
    end if;
    new.status_changed_at := now();
  end if;
  return new;
end $$;

create trigger before_update before update on public.kots
  for each row execute function private.before_kot_update();

-- After a KOT moves: move the order forward to the stage all its live rounds have reached,
-- never past 'ready' and never backwards.
create function private.after_kot_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rank constant jsonb := '{"new": 0, "preparing": 1, "ready": 2, "served": 3, "delivered": 3}';
  v_order public.orders;
  v_min int;
  v_target public.order_status;
begin
  select * into v_order from public.orders where id = new.order_id;
  if v_order.status in ('served', 'delivered', 'cancelled') then
    return null;
  end if;

  select min(case k.status when 'new' then 0 when 'preparing' then 1 else 2 end) into v_min
  from public.kots k where k.order_id = new.order_id and k.status <> 'cancelled';
  if v_min is null then
    return null;
  end if;

  v_target := (array['new', 'preparing', 'ready'])[v_min + 1]::public.order_status;
  if (v_rank ->> v_target::text)::int > (v_rank ->> v_order.status::text)::int then
    update public.orders set status = v_target where id = new.order_id;
  end if;
  return null;
end $$;

create trigger after_update after update of status on public.kots
  for each row execute function private.after_kot_update();

-- Order items: kot_id is set only by send_kot. Items already sent to the kitchen can be changed
-- or removed by a cashier or manager only (fixing a mistake), not by the waiter.
create function private.guard_order_item_kot() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_outlet uuid;
begin
  if current_setting('private.send_kot', true) is distinct from 'on' then
    if tg_op = 'INSERT' then
      new.kot_id := null;
    elsif tg_op = 'UPDATE' then
      new.kot_id := old.kot_id;
    end if;
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.kot_id is not null and auth.uid() is not null
     and current_setting('private.send_kot', true) is distinct from 'on' then
    select o.outlet_id into v_outlet from public.orders o where o.id = old.order_id;
    if not private.can(old.tenant_id, '{admin,owner,manager,cashier}', v_outlet, true) then
      raise exception 'This item is already in the kitchen; ask a cashier or manager to change it'
        using errcode = '42501';
    end if;
  end if;
  return coalesce(new, old);
end $$;

create trigger guard_kot before insert or update or delete on public.order_items
  for each row execute function private.guard_order_item_kot();

-- Send everything not yet sent on this order to the kitchen as the next round.
create function public.send_kot(p_order uuid) returns public.kots
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_kot public.kots;
begin
  select * into v_order from public.orders where id = p_order for update;
  if v_order.id is null
     or not private.can(v_order.tenant_id, '{admin,owner,manager,cashier,waiter}', v_order.outlet_id, true) then
    raise exception 'Order not found' using errcode = '42501';
  end if;
  if v_order.status in ('served', 'delivered', 'cancelled') then
    raise exception 'Order #% is already %', v_order.order_no, v_order.status using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.order_items i where i.order_id = p_order and i.kot_id is null) then
    raise exception 'Nothing new to send to the kitchen' using errcode = 'P0001';
  end if;

  insert into public.kots (tenant_id, outlet_id, order_id, round_no, created_by)
  values (v_order.tenant_id, v_order.outlet_id, p_order,
          coalesce((select max(k.round_no) from public.kots k where k.order_id = p_order), 0) + 1,
          auth.uid())
  returning * into v_kot;

  perform set_config('private.send_kot', 'on', true);
  update public.order_items set kot_id = v_kot.id where order_id = p_order and kot_id is null;
  perform set_config('private.send_kot', 'off', true);
  return v_kot;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Table status
-- ---------------------------------------------------------------------------------------------

-- Waiter asks for the bill; the table shows it until the bill is settled.
create function public.request_bill(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders where id = p_order;
  if v_order.id is null
     or not private.can(v_order.tenant_id, '{admin,owner,manager,cashier,waiter}', v_order.outlet_id, true) then
    raise exception 'Order not found' using errcode = '42501';
  end if;
  if v_order.status in ('served', 'delivered', 'cancelled') then
    raise exception 'Order #% is already %', v_order.order_no, v_order.status using errcode = 'P0001';
  end if;
  update public.orders set bill_requested_at = coalesce(bill_requested_at, now()) where id = p_order;
end $$;

-- One row per active table: free, occupied or bill_requested, with its open dine-in order.
-- security_invoker: the caller's own RLS on dining_tables and orders applies.
create view public.table_status with (security_invoker = true) as
select t.id as table_id, t.tenant_id, t.outlet_id, t.name, t.seats, t.area, t.sort_order,
       o.id as order_id, o.order_no, o.total, o.created_at as opened_at, o.bill_requested_at,
       case when o.id is null then 'free'
            when o.bill_requested_at is not null then 'bill_requested'
            else 'occupied' end as status
from public.dining_tables t
left join lateral (
  select o.* from public.orders o
  where o.table_id = t.id and o.type = 'dine_in'
    and o.status not in ('served', 'delivered', 'cancelled')
  order by o.created_at desc
  limit 1
) o on true
where t.is_active;

-- ---------------------------------------------------------------------------------------------
-- Day sessions (open / close the counter)
-- ---------------------------------------------------------------------------------------------

create table public.day_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  business_date date not null,
  opened_by uuid references public.profiles (id) on delete set null,
  opened_at timestamptz not null default now(),
  opening_cash numeric(12, 2) not null default 0 check (opening_cash >= 0),
  closed_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  counted_cash numeric(12, 2) check (counted_cash >= 0),
  expected_cash numeric(12, 2),
  cash_difference numeric(12, 2) generated always as (counted_cash - expected_cash) stored,
  close_notes text,
  summary jsonb,                                         -- totals frozen at close (see close_day)
  unique (tenant_id, id),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  check ((closed_at is null) = (counted_cash is null))
);
create unique index day_sessions_one_open on public.day_sessions (outlet_id) where closed_at is null;
create index on public.day_sessions (tenant_id, outlet_id, business_date desc);
create trigger keep_tenant before update on public.day_sessions for each row execute function private.keep_tenant();

alter table public.bills add column day_session_id uuid;
alter table public.bills
  add constraint bills_day_session_fk foreign key (tenant_id, day_session_id)
  references public.day_sessions (tenant_id, id);

create function private.tenant_today(p_tenant uuid) returns date
language sql stable security definer set search_path = '' as $$
  select (now() at time zone coalesce((select t.timezone from public.tenants t where t.id = p_tenant), 'Asia/Kolkata'))::date
$$;

-- Totals for a day session from its bills (void bills excluded, counted separately).
create function private.day_summary(p_session uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bills', count(*) filter (where not b.is_void),
    'voidBills', count(*) filter (where b.is_void),
    'subtotal', coalesce(sum(b.subtotal) filter (where not b.is_void), 0),
    'discount', coalesce(sum(b.discount) filter (where not b.is_void), 0),
    'cgst', coalesce(sum(b.cgst) filter (where not b.is_void), 0),
    'sgst', coalesce(sum(b.sgst) filter (where not b.is_void), 0),
    'total', coalesce(sum(b.total) filter (where not b.is_void), 0),
    'byMethod', coalesce((
      select jsonb_object_agg(m.method, m.amount) from (
        select p.method::text as method, sum(p.amount) as amount
        from public.bill_payments p join public.bills b2 on b2.id = p.bill_id
        where b2.day_session_id = p_session and not b2.is_void
        group by p.method) m), '{}'::jsonb))
  from public.bills b where b.day_session_id = p_session
$$;

create function public.open_day(p_outlet uuid, p_opening_cash numeric default 0) returns public.day_sessions
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid := (select o.tenant_id from public.outlets o where o.id = p_outlet);
  v_session public.day_sessions;
begin
  if v_tenant is null or not private.can(v_tenant, '{admin,owner,manager,cashier}', p_outlet, true) then
    raise exception 'Outlet not found' using errcode = '42501';
  end if;
  if coalesce(p_opening_cash, -1) < 0 then
    raise exception 'Opening cash cannot be negative' using errcode = '22023';
  end if;
  if exists (select 1 from public.day_sessions s where s.outlet_id = p_outlet and s.closed_at is null) then
    raise exception 'The day is already open at this outlet' using errcode = 'P0001';
  end if;
  insert into public.day_sessions (tenant_id, outlet_id, business_date, opened_by, opening_cash)
  values (v_tenant, p_outlet, private.tenant_today(v_tenant), auth.uid(), p_opening_cash)
  returning * into v_session;
  return v_session;
end $$;

-- Close the counter: expected cash = opening cash + cash payments of this session's live bills.
-- Orders still open are reported in the summary (they carry over), not blocked.
create function public.close_day(p_outlet uuid, p_counted_cash numeric, p_notes text default null)
returns public.day_sessions
language plpgsql security definer set search_path = '' as $$
declare
  v_session public.day_sessions;
  v_summary jsonb;
begin
  select * into v_session from public.day_sessions s where s.outlet_id = p_outlet and s.closed_at is null for update;
  if v_session.id is null then
    raise exception 'The day is not open at this outlet' using errcode = 'P0001';
  end if;
  if not private.can(v_session.tenant_id, '{admin,owner,manager,cashier}', p_outlet, true) then
    raise exception 'Outlet not found' using errcode = '42501';
  end if;
  if coalesce(p_counted_cash, -1) < 0 then
    raise exception 'Counted cash cannot be negative' using errcode = '22023';
  end if;

  v_summary := private.day_summary(v_session.id) || jsonb_build_object(
    'openOrders', (select count(*) from public.orders o
                   where o.outlet_id = p_outlet and o.status not in ('served', 'delivered', 'cancelled')));

  update public.day_sessions set
    closed_at = now(), closed_by = auth.uid(), counted_cash = p_counted_cash,
    expected_cash = opening_cash + coalesce((v_summary -> 'byMethod' ->> 'cash')::numeric, 0),
    close_notes = nullif(trim(p_notes), ''), summary = v_summary
  where id = v_session.id
  returning * into v_session;
  return v_session;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Bill numbers per outlet per financial year (April–March, tenant time zone)
-- ---------------------------------------------------------------------------------------------

create table public.bill_series (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  financial_year text not null check (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),   -- '2026-27'
  last_no int not null default 0,
  primary key (outlet_id, financial_year),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade
);

create function private.financial_year(p_at timestamptz, p_tenant uuid) returns text
language sql stable security definer set search_path = '' as $$
  with d as (
    select (p_at at time zone coalesce((select t.timezone from public.tenants t where t.id = p_tenant), 'Asia/Kolkata'))::date as day
  )
  select case when extract(month from day) >= 4
              then extract(year from day)::int::text || '-' || lpad(((extract(year from day)::int + 1) % 100)::text, 2, '0')
              else (extract(year from day)::int - 1)::text || '-' || lpad((extract(year from day)::int % 100)::text, 2, '0') end
  from d
$$;

alter table public.bills add column financial_year text;
alter table public.bills add column invoice_no text;

-- Existing bills keep their numbers; they are labelled with the year they were paid in and the
-- series counters start after the highest existing number in each year.
update public.bills b set
  financial_year = private.financial_year(b.paid_at, b.tenant_id),
  invoice_no = private.financial_year(b.paid_at, b.tenant_id) || '/' || lpad(b.bill_no::text, 5, '0');
insert into public.bill_series (tenant_id, outlet_id, financial_year, last_no)
select tenant_id, outlet_id, financial_year, max(bill_no) from public.bills group by 1, 2, 3;

alter table public.bills alter column financial_year set not null;
alter table public.bills alter column invoice_no set not null;
alter table public.bills drop constraint bills_outlet_id_bill_no_key;
alter table public.bills add constraint bills_outlet_fy_bill_no_key unique (outlet_id, financial_year, bill_no);

-- Replaces 0003's version: same amounts and checks, numbering now per financial year.
-- outlets.last_bill_no is no longer used for bills.
create or replace function private.before_bill_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_tax numeric;
  v_fy text;
begin
  select * into v_order from public.orders where id = new.order_id and tenant_id = new.tenant_id;
  if v_order.status = 'cancelled' then
    raise exception 'Cannot bill a cancelled order' using errcode = 'P0001';
  end if;
  if new.discount > v_order.subtotal then
    raise exception 'Discount is more than the bill' using errcode = '22023';
  end if;

  v_fy := private.financial_year(coalesce(new.paid_at, now()), v_order.tenant_id);
  insert into public.bill_series as s (tenant_id, outlet_id, financial_year, last_no)
  values (v_order.tenant_id, v_order.outlet_id, v_fy, 1)
  on conflict (outlet_id, financial_year) do update set last_no = s.last_no + 1
  returning s.last_no into new.bill_no;

  new.outlet_id := v_order.outlet_id;
  new.financial_year := v_fy;
  new.invoice_no := v_fy || '/' || lpad(new.bill_no::text, 5, '0');
  new.subtotal := v_order.subtotal;
  new.taxable_amount := v_order.subtotal - new.discount;
  v_tax := case when v_order.subtotal = 0 then 0
                else round(v_order.tax_total * new.taxable_amount / v_order.subtotal, 2) end;
  new.cgst := round(v_tax / 2, 2);
  new.sgst := v_tax - new.cgst;
  new.total := new.taxable_amount + v_tax;
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.is_void := false;
  new.void_reason := null;
  return new;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Split payments and settling a bill
-- ---------------------------------------------------------------------------------------------


-- The POS path for billing: one bill for the order, paid by one or more payments that must add
-- up to the bill total exactly (split between guests or between cash/UPI/card). Needs an open
-- day. Dine-in and takeaway orders are marked served; their table becomes free.
create function public.settle_bill(p_order uuid, p_discount numeric, p_payments jsonb)
returns public.bills
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_session uuid;
  v_bill public.bills;
  v_paid numeric;
  v_methods int;
  v_payment jsonb;
begin
  select * into v_order from public.orders where id = p_order for update;
  if v_order.id is null
     or not private.can(v_order.tenant_id, '{admin,owner,manager,cashier}', v_order.outlet_id, true) then
    raise exception 'Order not found' using errcode = '42501';
  end if;
  if exists (select 1 from public.bills b where b.order_id = p_order and not b.is_void) then
    raise exception 'Order #% is already billed', v_order.order_no using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.order_items i where i.order_id = p_order) then
    raise exception 'Order #% has no items', v_order.order_no using errcode = 'P0001';
  end if;
  select s.id into v_session from public.day_sessions s where s.outlet_id = v_order.outlet_id and s.closed_at is null;
  if v_session is null then
    raise exception 'Open the day at the counter before billing' using errcode = 'P0001';
  end if;
  if jsonb_typeof(p_payments) <> 'array' or jsonb_array_length(p_payments) = 0 then
    raise exception 'Add at least one payment' using errcode = '22023';
  end if;

  select sum((p ->> 'amount')::numeric), count(distinct p ->> 'method')
    into v_paid, v_methods from jsonb_array_elements(p_payments) p;

  insert into public.bills (tenant_id, outlet_id, order_id, discount, payment_mode, day_session_id)
  values (v_order.tenant_id, v_order.outlet_id, p_order, coalesce(p_discount, 0),
          case when v_methods = 1 then (p_payments -> 0 ->> 'method')::public.payment_mode else 'other' end,
          v_session)
  returning * into v_bill;

  if v_paid is distinct from v_bill.total then
    raise exception 'Payments add up to %, the bill is %', coalesce(v_paid, 0), v_bill.total using errcode = '22023';
  end if;

  for v_payment in select * from jsonb_array_elements(p_payments) loop
    if coalesce((v_payment ->> 'amount')::numeric, 0) <= 0 then
      raise exception 'Each payment must be more than zero' using errcode = '22023';
    end if;
    insert into public.bill_payments (tenant_id, outlet_id, bill_id, method, amount, reference, created_by)
    values (v_order.tenant_id, v_order.outlet_id, v_bill.id, (v_payment ->> 'method')::public.payment_mode,
            (v_payment ->> 'amount')::numeric, nullif(trim(v_payment ->> 'reference'), ''), auth.uid());
  end loop;

  if v_order.type in ('dine_in', 'takeaway') and v_order.status not in ('served', 'delivered') then
    update public.orders set status = 'served' where id = p_order;
  end if;
  return v_bill;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security and grants
-- ---------------------------------------------------------------------------------------------

alter table public.kots enable row level security;
alter table public.day_sessions enable row level security;
alter table public.bill_payments enable row level security;
alter table public.bill_series enable row level security;

grant select on public.kots, public.day_sessions, public.bill_payments, public.table_status to authenticated;
grant update (status) on public.kots to authenticated;
grant all on public.kots, public.day_sessions, public.bill_payments, public.bill_series to service_role;
grant select on public.table_status to service_role;
revoke all on public.kots, public.day_sessions, public.bill_payments, public.bill_series, public.table_status from anon;
-- bill_series is internal: no client access at all.
revoke all on public.bill_series from authenticated;

-- order_items.kot_id is set by send_kot only. A column-level revoke would not help here (the
-- table-level UPDATE grant from 0003 covers every column); private.guard_order_item_kot enforces it.

-- KOTs: floor and kitchen staff of the outlet read; kitchen and above move the status.
create policy kots_read on public.kots for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier,waiter,kitchen}', outlet_id));
create policy kots_update on public.kots for update to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier,waiter,kitchen}', outlet_id, true))
  with check (private.can(tenant_id, '{admin,owner,manager,cashier,waiter,kitchen}', outlet_id, true));

-- Day sessions and payments: cashier and above read; writes only through the functions above.
create policy day_sessions_read on public.day_sessions for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier}', outlet_id));
create policy bill_payments_read on public.bill_payments for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier}', outlet_id));

revoke execute on function public.send_kot(uuid), public.request_bill(uuid), public.open_day(uuid, numeric),
  public.close_day(uuid, numeric, text), public.settle_bill(uuid, numeric, jsonb) from public, anon;
grant execute on function public.send_kot(uuid), public.request_bill(uuid), public.open_day(uuid, numeric),
  public.close_day(uuid, numeric, text), public.settle_bill(uuid, numeric, jsonb) to authenticated, service_role;

-- The KDS listens to KOT changes (order_items and orders are already published in 0003).
alter publication supabase_realtime add table public.kots;
