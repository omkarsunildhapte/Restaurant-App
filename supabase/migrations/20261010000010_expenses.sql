-- Expenses: staff salaries and daily purchases, and the cash they take out of the drawer.
--
--   employees            everyone the restaurant pays, with or without an app login
--   employee_pay_rates   monthly / daily / hourly rate, history kept (effective_from)
--   salary_entries       salary paid, advance, bonus, deduction, per employee per month
--   vendors              who the restaurant buys from
--   purchases            one purchase (bill) at an outlet: vendor, payment, optional bill photo
--   purchase_items       its lines: item, quantity, unit, rate
--   cash_outs            other cash paid from the counter (tips to delivery, repairs)
--
-- Salaries are owner/admin only (sensitive). Purchases are owner/admin/manager, per outlet.
-- Cash paid out (cash purchases, cash staff payments, cash_outs) is subtracted from the
-- expected cash at day close: expected = opening + cash sales − cash out.

create type public.expense_mode as enum ('cash', 'upi', 'bank', 'card', 'credit');   -- credit = not paid yet
create type public.pay_type as enum ('monthly', 'daily', 'hourly');
create type public.salary_entry_kind as enum ('salary', 'advance', 'bonus', 'deduction');
create type public.purchase_unit as enum ('kg', 'g', 'l', 'ml', 'pcs', 'pack', 'dozen', 'box', 'bag');

-- ---------------------------------------------------------------------------------------------
-- Staff pay
-- ---------------------------------------------------------------------------------------------

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid,                                         -- usual outlet; null = works across outlets
  user_id uuid references public.profiles (id) on delete set null,   -- if they also sign in to the apps
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  phone text,
  job_title text,                                         -- "Chef", "Helper", "Waiter"
  joined_on date,
  left_on date,
  payment_note text,                                      -- UPI id or bank account, for paying
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, user_id),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete set null (outlet_id),
  check (left_on is null or joined_on is null or left_on >= joined_on)
);

create table public.employee_pay_rates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  employee_id uuid not null,
  pay_type public.pay_type not null,
  rate numeric(10, 2) not null check (rate > 0),
  effective_from date not null,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (employee_id, effective_from),
  foreign key (tenant_id, employee_id) references public.employees (tenant_id, id) on delete cascade
);

create table public.salary_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  employee_id uuid not null,
  kind public.salary_entry_kind not null,
  amount numeric(10, 2) not null check (amount > 0),
  entry_date date not null,
  period_month date not null check (extract(day from period_month) = 1),   -- which month it belongs to
  payment_mode public.expense_mode,                       -- null for a deduction (no money moves)
  outlet_id uuid,                                         -- whose drawer, when paid in cash
  note text,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  foreign key (tenant_id, employee_id) references public.employees (tenant_id, id) on delete cascade,
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete set null (outlet_id),
  check ((kind = 'deduction') = (payment_mode is null)),
  check (payment_mode is distinct from 'credit'),
  check (payment_mode is distinct from 'cash' or outlet_id is not null)
);
create index on public.salary_entries (tenant_id, period_month);
create index on public.salary_entries (employee_id, period_month);

-- ---------------------------------------------------------------------------------------------
-- Purchases
-- ---------------------------------------------------------------------------------------------

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name citext not null check (length(trim(name::text)) between 1 and 120),
  phone text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  purchase_date date not null,
  vendor_id uuid,
  vendor_name text,                                       -- as written on the day
  subtotal numeric(12, 2) not null default 0,             -- sum of the lines (trigger-maintained)
  gst_amount numeric(12, 2) not null default 0 check (gst_amount >= 0),   -- input GST on the bill, if any
  total numeric(12, 2) not null default 0,
  payment_mode public.expense_mode not null default 'cash',
  paid_at timestamptz,                                    -- null while a credit purchase is unpaid
  settled_mode public.expense_mode check (settled_mode is distinct from 'credit'),   -- how credit was paid later
  notes text,
  bill_path text,                                         -- storage: purchase-bills/<tenant_id>/<file>
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, vendor_id) references public.vendors (tenant_id, id) on delete set null (vendor_id),
  check (payment_mode = 'credit' or paid_at is not null)
);
create index on public.purchases (tenant_id, outlet_id, purchase_date desc);
create index on public.purchases (outlet_id, paid_at);

create table public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  purchase_id uuid not null,
  item_name text not null check (length(trim(item_name)) between 1 and 120),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit public.purchase_unit not null default 'kg',
  rate numeric(12, 2) not null check (rate >= 0),
  amount numeric(12, 2) generated always as (round(quantity * rate, 2)) stored,
  sort_order int not null default 0,
  foreign key (tenant_id, purchase_id) references public.purchases (tenant_id, id) on delete cascade
);
create index on public.purchase_items (purchase_id);
create index on public.purchase_items (tenant_id, lower(item_name));

-- Other cash paid from the counter.
create table public.cash_outs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  label text not null check (length(trim(label)) between 1 and 120),
  amount numeric(12, 2) not null check (amount > 0),
  paid_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade
);
create index on public.cash_outs (outlet_id, paid_at);

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------

create trigger keep_tenant before update on public.employees for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.employee_pay_rates for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.salary_entries for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.vendors for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.purchases for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.purchase_items for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.cash_outs for each row execute function private.keep_tenant();
create trigger touch before update on public.purchases for each row execute function private.touch_updated_at();

-- Salary entry: entry date defaults to the restaurant's today, the month to that date's month.
create function private.before_salary_entry() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.entry_date := coalesce(new.entry_date, private.tenant_today(new.tenant_id));
  new.period_month := date_trunc('month', coalesce(new.period_month, new.entry_date))::date;
  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

create trigger before_write before insert or update on public.salary_entries
  for each row execute function private.before_salary_entry();

-- Purchase: date defaults to today, vendor name from the vendor, paid now unless on credit,
-- totals from the lines (only recalc_purchase changes subtotal).
create function private.before_purchase_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.purchase_date := coalesce(new.purchase_date, private.tenant_today(new.tenant_id));
    new.subtotal := 0;
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    if current_setting('private.purchase_recalc', true) is distinct from 'on' then
      new.subtotal := old.subtotal;
    end if;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if new.vendor_id is not null and (new.vendor_name is null or tg_op = 'UPDATE' and new.vendor_id is distinct from old.vendor_id) then
    select v.name::text into new.vendor_name from public.vendors v where v.id = new.vendor_id;
  end if;
  new.vendor_name := nullif(trim(new.vendor_name), '');

  if new.payment_mode <> 'credit' then
    new.paid_at := coalesce(new.paid_at, case when tg_op = 'UPDATE' then old.paid_at end, now());
    new.settled_mode := null;
  elsif tg_op = 'INSERT' then
    new.paid_at := null;
  end if;

  new.total := new.subtotal + new.gst_amount;
  return new;
end $$;

create trigger before_write before insert or update on public.purchases
  for each row execute function private.before_purchase_write();

create function private.recalc_purchase(p_purchase uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('private.purchase_recalc', 'on', true);
  update public.purchases p set subtotal = coalesce((select sum(i.amount) from public.purchase_items i where i.purchase_id = p_purchase), 0)
  where p.id = p_purchase;
  perform set_config('private.purchase_recalc', 'off', true);
end $$;

create function private.after_purchase_item_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.recalc_purchase(coalesce(new.purchase_id, old.purchase_id));
  return null;
end $$;

create trigger after_write after insert or update or delete on public.purchase_items
  for each row execute function private.after_purchase_item_write();

-- ---------------------------------------------------------------------------------------------
-- Row Level Security and grants
-- ---------------------------------------------------------------------------------------------

alter table public.employees enable row level security;
alter table public.employee_pay_rates enable row level security;
alter table public.salary_entries enable row level security;
alter table public.vendors enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.cash_outs enable row level security;

grant select, insert, update, delete on public.employees, public.employee_pay_rates, public.salary_entries,
  public.vendors, public.purchases, public.purchase_items to authenticated;
grant select on public.cash_outs to authenticated;
grant all on public.employees, public.employee_pay_rates, public.salary_entries, public.vendors, public.purchases,
  public.purchase_items, public.cash_outs to service_role;
revoke all on public.employees, public.employee_pay_rates, public.salary_entries, public.vendors, public.purchases,
  public.purchase_items, public.cash_outs from anon;

-- Salaries: owners and admins only.
do $$
declare
  t text;
begin
  foreach t in array array['employees', 'employee_pay_rates', 'salary_entries'] loop
    execute format($p$create policy %I on public.%I for all to authenticated
                     using (private.can(tenant_id, '{admin,owner}'))
                     with check (private.can(tenant_id, '{admin,owner}', null, true))$p$, t || '_owner', t);
  end loop;
end $$;

-- Vendors: the business's list, used by everyone who records purchases.
create policy vendors_read on public.vendors for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager}'));
create policy vendors_write on public.vendors for all to authenticated
  using (private.can(tenant_id, '{admin,owner,manager}', null, true))
  with check (private.can(tenant_id, '{admin,owner,manager}', null, true));

-- Purchases: owners/admins and the outlet's managers.
create policy purchases_read on public.purchases for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager}', outlet_id));
create policy purchases_write on public.purchases for all to authenticated
  using (private.can(tenant_id, '{admin,owner,manager}', outlet_id, true))
  with check (private.can(tenant_id, '{admin,owner,manager}', outlet_id, true));

create policy purchase_items_read on public.purchase_items for select to authenticated
  using (exists (select 1 from public.purchases p where p.id = purchase_id));
create policy purchase_items_write on public.purchase_items for all to authenticated
  using (exists (select 1 from public.purchases p where p.id = purchase_id
                 and private.can(p.tenant_id, '{admin,owner,manager}', p.outlet_id, true)))
  with check (exists (select 1 from public.purchases p where p.id = purchase_id and p.tenant_id = purchase_items.tenant_id
                      and private.can(p.tenant_id, '{admin,owner,manager}', p.outlet_id, true)));

-- Counter pay-outs: cashier and above of the outlet read; written through record_cash_out.
create policy cash_outs_read on public.cash_outs for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier}', outlet_id));

-- Bill photos: private bucket, files under "<tenant_id>/...".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('purchase-bills', 'purchase-bills', false, 5 * 1024 * 1024,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy purchase_bills_read on storage.objects for select to authenticated
  using (bucket_id = 'purchase-bills' and private.can(private.path_tenant(name), '{admin,owner,manager}'));
create policy purchase_bills_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'purchase-bills' and private.can(private.path_tenant(name), '{admin,owner,manager}', null, true));
create policy purchase_bills_delete on storage.objects for delete to authenticated
  using (bucket_id = 'purchase-bills' and private.can(private.path_tenant(name), '{admin,owner,manager}', null, true));

-- ---------------------------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------------------------

-- A credit purchase is paid: record when and how.
create function public.mark_purchase_paid(p_purchase uuid, p_mode public.expense_mode) returns public.purchases
language plpgsql security definer set search_path = '' as $$
declare
  v public.purchases;
begin
  select * into v from public.purchases where id = p_purchase for update;
  if v.id is null or not private.can(v.tenant_id, '{admin,owner,manager}', v.outlet_id, true) then
    raise exception 'Purchase not found' using errcode = '42501';
  end if;
  if v.payment_mode <> 'credit' or v.paid_at is not null then
    raise exception 'This purchase is already paid' using errcode = 'P0001';
  end if;
  if p_mode is null or p_mode = 'credit' then
    raise exception 'Choose how it was paid' using errcode = '22023';
  end if;
  update public.purchases set paid_at = now(), settled_mode = p_mode where id = p_purchase returning * into v;
  return v;
end $$;

-- Pay rate in force on a day (latest effective_from on or before it).
create function private.pay_rate_on(p_employee uuid, p_day date) returns public.employee_pay_rates
language sql stable security definer set search_path = '' as $$
  select * from public.employee_pay_rates r
  where r.employee_id = p_employee and r.effective_from <= p_day
  order by r.effective_from desc limit 1
$$;

-- One row per employee for a month: what is due and what has been paid.
-- Monthly pay is due in full; daily/hourly pay depends on days worked, so `due` is 0 and the
-- owner enters the amount when paying.
create function public.salary_month(p_tenant uuid, p_month date) returns table (
  employee_id uuid,
  full_name text,
  job_title text,
  outlet_id uuid,
  is_active boolean,
  pay_type public.pay_type,
  rate numeric,
  due numeric,
  advances numeric,
  bonus numeric,
  deductions numeric,
  paid numeric,
  balance numeric
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_start date := date_trunc('month', p_month)::date;
  v_end date := (date_trunc('month', p_month) + interval '1 month - 1 day')::date;
begin
  if not private.can(p_tenant, '{admin,owner}') then
    raise exception 'Salaries are for owners only' using errcode = '42501';
  end if;

  return query
  with e as (
    select x.* from public.employees x
    where x.tenant_id = p_tenant
      and (x.joined_on is null or x.joined_on <= v_end)
      and ((x.is_active and (x.left_on is null or x.left_on >= v_start))
           or exists (select 1 from public.salary_entries s where s.employee_id = x.id and s.period_month = v_start))
  ), sums as (
    select s.employee_id,
           coalesce(sum(s.amount) filter (where s.kind = 'advance'), 0) as advances,
           coalesce(sum(s.amount) filter (where s.kind = 'bonus'), 0) as bonus,
           coalesce(sum(s.amount) filter (where s.kind = 'deduction'), 0) as deductions,
           coalesce(sum(s.amount) filter (where s.kind = 'salary'), 0) as paid
    from public.salary_entries s
    where s.tenant_id = p_tenant and s.period_month = v_start
    group by s.employee_id
  )
  select e.id, e.full_name, e.job_title, e.outlet_id, e.is_active, r.pay_type, r.rate,
         case when r.pay_type = 'monthly' then r.rate else 0 end::numeric,
         coalesce(sums.advances, 0), coalesce(sums.bonus, 0), coalesce(sums.deductions, 0), coalesce(sums.paid, 0),
         (case when r.pay_type = 'monthly' then r.rate else 0 end
          + coalesce(sums.bonus, 0) - coalesce(sums.deductions, 0) - coalesce(sums.advances, 0) - coalesce(sums.paid, 0))::numeric
  from e
  left join lateral private.pay_rate_on(e.id, v_end) r on true
  left join sums on sums.employee_id = e.id
  order by e.is_active desc, e.full_name;
end $$;

-- Purchases over a period: totals, by item, by vendor, by day, by payment mode.
create function public.purchases_summary(p_tenant uuid, p_from date, p_to date, p_outlet uuid default null) returns jsonb
language plpgsql stable set search_path = '' as $$
declare
  v_result jsonb;
begin
  if not private.can(p_tenant, '{admin,owner,manager}', p_outlet) then
    raise exception 'Purchases are for owners and managers' using errcode = '42501';
  end if;
  with p as (
    select * from public.purchases x
    where x.tenant_id = p_tenant and x.purchase_date between p_from and p_to
      and (p_outlet is null or x.outlet_id = p_outlet)
  )
  select jsonb_build_object(
    'count', (select count(*) from p),
    'total', (select coalesce(sum(total), 0) from p),
    'gst', (select coalesce(sum(gst_amount), 0) from p),
    'unpaid', (select coalesce(sum(total), 0) from p where paid_at is null),
    'byDay', coalesce((select jsonb_agg(d order by d.day) from (
        select purchase_date as day, count(*) as purchases, sum(total) as total from p group by 1) d), '[]'),
    'byVendor', coalesce((select jsonb_agg(v order by v.total desc) from (
        select coalesce(vendor_name, 'No vendor') as vendor, count(*) as purchases, sum(total) as total,
               coalesce(sum(total) filter (where paid_at is null), 0) as unpaid
        from p group by 1) v), '[]'),
    'byMode', coalesce((select jsonb_object_agg(m.mode, m.total) from (
        select coalesce(settled_mode, payment_mode)::text as mode, sum(total) as total from p group by 1) m), '{}'),
    'byItem', coalesce((select jsonb_agg(i order by i.amount desc) from (
        select min(it.item_name) as item, it.unit, sum(it.quantity) as quantity, sum(it.amount) as amount,
               round(sum(it.amount) / nullif(sum(it.quantity), 0), 2) as average_rate
        from public.purchase_items it join p on p.id = it.purchase_id
        group by lower(it.item_name), it.unit) i), '[]')
  ) into v_result;
  return v_result;
end $$;

-- Cash that left the drawer during a day session: cash purchases (incl. credit later paid in
-- cash), cash staff payments, and counter pay-outs. Salary rows carry no name or type; the
-- cashier only needs the amount to count the drawer.
create function public.cash_out_for_day(p_session uuid) returns table (
  kind text,
  label text,
  amount numeric,
  paid_at timestamptz,
  recorded_by_name text
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_s public.day_sessions;
  v_until timestamptz;
begin
  select * into v_s from public.day_sessions s where s.id = p_session;
  if v_s.id is null or not private.can(v_s.tenant_id, '{admin,owner,manager,cashier}', v_s.outlet_id) then
    raise exception 'Day session not found' using errcode = '42501';
  end if;
  v_until := coalesce(v_s.closed_at, now());

  return query
  select x.kind, x.label, x.amount, x.paid_at, pr.full_name
  from (
    select 'purchase'::text as kind,
           coalesce(p.vendor_name, (select string_agg(i.item_name, ', ' order by i.sort_order) from public.purchase_items i where i.purchase_id = p.id), 'Purchase') as label,
           p.total as amount, p.paid_at, p.created_by
    from public.purchases p
    where p.outlet_id = v_s.outlet_id and coalesce(p.settled_mode, p.payment_mode) = 'cash'
      and p.paid_at >= v_s.opened_at and p.paid_at <= v_until
    union all
    select 'staff', 'Staff payment', s.amount, s.created_at, s.created_by
    from public.salary_entries s
    where s.outlet_id = v_s.outlet_id and s.payment_mode = 'cash' and s.kind <> 'deduction'
      and s.created_at >= v_s.opened_at and s.created_at <= v_until
    union all
    select 'other', c.label, c.amount, c.paid_at, c.created_by
    from public.cash_outs c
    where c.outlet_id = v_s.outlet_id and c.paid_at >= v_s.opened_at and c.paid_at <= v_until
  ) x
  left join public.profiles pr on pr.id = x.created_by
  order by x.paid_at;
end $$;

-- Cash paid from the counter during an open day: a quick purchase (milk, vegetables) or anything else.
create function public.record_cash_out(p_outlet uuid, p_kind text, p_label text, p_amount numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid := (select o.tenant_id from public.outlets o where o.id = p_outlet);
  v_id uuid;
begin
  if v_tenant is null or not private.can(v_tenant, '{admin,owner,manager,cashier}', p_outlet, true) then
    raise exception 'Outlet not found' using errcode = '42501';
  end if;
  if not exists (select 1 from public.day_sessions s where s.outlet_id = p_outlet and s.closed_at is null) then
    raise exception 'Open the day at the counter first' using errcode = 'P0001';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'Amount must be more than zero' using errcode = '22023';
  end if;
  if nullif(trim(p_label), '') is null then
    raise exception 'Say what the money was for' using errcode = '22023';
  end if;

  if p_kind = 'purchase' then
    insert into public.purchases (tenant_id, outlet_id, payment_mode, notes)
    values (v_tenant, p_outlet, 'cash', 'Paid from the counter')
    returning id into v_id;
    insert into public.purchase_items (tenant_id, purchase_id, item_name, quantity, unit, rate)
    values (v_tenant, v_id, trim(p_label), 1, 'pcs', p_amount);
  elsif p_kind = 'other' then
    insert into public.cash_outs (tenant_id, outlet_id, label, amount)
    values (v_tenant, p_outlet, trim(p_label), p_amount)
    returning id into v_id;
  else
    raise exception 'Kind must be purchase or other' using errcode = '22023';
  end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Day close: expected cash now subtracts cash paid out (replaces 0006's versions)
-- ---------------------------------------------------------------------------------------------

create function private.cash_out_by_kind(p_session uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with s as (select * from public.day_sessions where id = p_session),
  rows as (
    select 'purchase' as kind, p.total as amount from public.purchases p, s
    where p.outlet_id = s.outlet_id and coalesce(p.settled_mode, p.payment_mode) = 'cash'
      and p.paid_at >= s.opened_at and p.paid_at <= coalesce(s.closed_at, now())
    union all
    select 'staff', e.amount from public.salary_entries e, s
    where e.outlet_id = s.outlet_id and e.payment_mode = 'cash' and e.kind <> 'deduction'
      and e.created_at >= s.opened_at and e.created_at <= coalesce(s.closed_at, now())
    union all
    select 'other', c.amount from public.cash_outs c, s
    where c.outlet_id = s.outlet_id and c.paid_at >= s.opened_at and c.paid_at <= coalesce(s.closed_at, now())
  )
  select jsonb_build_object(
    'purchase', coalesce(sum(amount) filter (where kind = 'purchase'), 0),
    'staff', coalesce(sum(amount) filter (where kind = 'staff'), 0),
    'other', coalesce(sum(amount) filter (where kind = 'other'), 0))
  from rows
$$;

create or replace function private.day_summary(p_session uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with by_kind as (select private.cash_out_by_kind(p_session) as k)
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
        group by p.method) m), '{}'::jsonb),
    'cashOutByKind', (select k from by_kind),
    'cashOut', (select (k ->> 'purchase')::numeric + (k ->> 'staff')::numeric + (k ->> 'other')::numeric from by_kind))
  from public.bills b where b.day_session_id = p_session
$$;

create or replace function public.close_day(p_outlet uuid, p_counted_cash numeric, p_notes text default null)
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
    expected_cash = opening_cash + coalesce((v_summary -> 'byMethod' ->> 'cash')::numeric, 0)
                    - coalesce((v_summary ->> 'cashOut')::numeric, 0),
    close_notes = nullif(trim(p_notes), ''), summary = v_summary
  where id = v_session.id
  returning * into v_session;
  return v_session;
end $$;

revoke execute on function public.mark_purchase_paid(uuid, public.expense_mode), public.salary_month(uuid, date),
  public.purchases_summary(uuid, date, date, uuid), public.cash_out_for_day(uuid),
  public.record_cash_out(uuid, text, text, numeric) from public, anon;
grant execute on function public.mark_purchase_paid(uuid, public.expense_mode), public.salary_month(uuid, date),
  public.purchases_summary(uuid, date, date, uuid), public.cash_out_for_day(uuid),
  public.record_cash_out(uuid, text, text, numeric) to authenticated, service_role;
