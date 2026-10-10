-- Outlet operations: dining tables, orders, order items and GST bills.
-- These rows belong to an outlet, so staff tied to one outlet only see that outlet.
-- The POS, KDS and waiter apps (Phase 3) build on these tables.

create type public.order_type as enum ('dine_in', 'takeaway', 'delivery');
create type public.order_status as enum ('new', 'preparing', 'ready', 'served', 'delivered', 'cancelled');
create type public.payment_mode as enum ('cash', 'upi', 'card', 'other');

create table public.dining_tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  name text not null check (length(trim(name)) > 0),   -- "T1", "Patio 3"
  seats int not null default 4 check (seats > 0 and seats <= 50),
  area text,                                             -- "Ground floor", "Rooftop"
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (outlet_id, name),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  order_no int not null,                                 -- per outlet, assigned by trigger
  type public.order_type not null default 'dine_in',
  status public.order_status not null default 'new',
  table_id uuid,
  customer_name text,
  customer_phone text,
  notes text,
  subtotal numeric(12, 2) not null default 0,            -- before tax (maintained from items)
  tax_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (outlet_id, order_no),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, table_id) references public.dining_tables (tenant_id, id) on delete set null (table_id)
);
create index on public.orders (tenant_id, outlet_id, created_at desc);
create index on public.orders (outlet_id, status) where status not in ('served', 'delivered', 'cancelled');

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_id uuid not null,
  item_id uuid,
  combo_id uuid,
  name text not null,                                    -- snapshot, so old orders survive menu edits
  variant_name text,
  addons jsonb not null default '[]'::jsonb,             -- [{"name": "Extra cheese", "price": 30}]
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),   -- item/variant price + add-ons
  tax_rate numeric(5, 2) not null default 0,
  line_subtotal numeric(12, 2) not null default 0,
  line_tax numeric(12, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, order_id) references public.orders (tenant_id, id) on delete cascade,
  foreign key (tenant_id, item_id) references public.menu_items (tenant_id, id) on delete set null (item_id),
  foreign key (tenant_id, combo_id) references public.combos (tenant_id, id) on delete set null (combo_id)
);
create index on public.order_items (order_id);
create index on public.order_items (tenant_id, item_id);

-- GST invoice. Never deleted or edited; a wrong bill is voided and re-issued.
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  outlet_id uuid not null,
  order_id uuid not null,
  bill_no int not null,                                  -- per outlet, assigned by trigger
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  taxable_amount numeric(12, 2) not null default 0,
  cgst numeric(12, 2) not null default 0,
  sgst numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  payment_mode public.payment_mode not null,
  paid_at timestamptz not null default now(),
  is_void boolean not null default false,
  void_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (outlet_id, bill_no),
  foreign key (tenant_id, outlet_id) references public.outlets (tenant_id, id) on delete cascade,
  foreign key (tenant_id, order_id) references public.orders (tenant_id, id),
  check (not is_void or void_reason is not null)
);
create index on public.bills (tenant_id, outlet_id, paid_at desc);
create unique index bills_one_live_per_order on public.bills (order_id) where not is_void;

-- ---------------------------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------------------------

create trigger keep_tenant before update on public.dining_tables for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.orders for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.order_items for each row execute function private.keep_tenant();
create trigger keep_tenant before update on public.bills for each row execute function private.keep_tenant();
create trigger touch before update on public.orders for each row execute function private.touch_updated_at();

-- New order: next number for the outlet, creator, and zero totals (items fill them in).
create function private.before_order_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.outlets set last_order_no = last_order_no + 1
  where id = new.outlet_id and tenant_id = new.tenant_id
  returning last_order_no into new.order_no;

  new.status := 'new';
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.subtotal := 0;
  new.tax_total := 0;
  new.total := 0;
  new.status_changed_at := now();
  return new;
end $$;

create trigger before_insert before insert on public.orders
  for each row execute function private.before_order_insert();

-- Status flow: new → preparing → ready → served (dine-in, takeaway) / delivered (delivery).
-- Steps can be skipped forward; cancel any time before the order is finished.
-- Kitchen may only move the status; cancelling needs a cashier or above.
create function private.before_order_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rank constant jsonb := '{"new": 0, "preparing": 1, "ready": 2, "served": 3, "delivered": 3}';
begin
  -- Totals and numbering are trigger-owned.
  if current_setting('private.recalc', true) is distinct from 'on' then
    new.order_no := old.order_no;
    new.subtotal := old.subtotal;
    new.tax_total := old.tax_total;
    new.total := old.total;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;

  if auth.uid() is not null
     and not private.can(new.tenant_id, '{admin,owner,manager,cashier,waiter}', new.outlet_id, true)
     and (new.type, new.table_id, new.customer_name, new.customer_phone, new.notes, new.outlet_id)
         is distinct from (old.type, old.table_id, old.customer_name, old.customer_phone, old.notes, old.outlet_id) then
    raise exception 'Kitchen staff can only change the order status' using errcode = '42501';
  end if;

  if new.outlet_id is distinct from old.outlet_id then
    raise exception 'An order cannot move to another outlet' using errcode = '42501';
  end if;

  if new.status is distinct from old.status then
    if old.status in ('served', 'delivered', 'cancelled') then
      raise exception 'Order #% is already %', old.order_no, old.status using errcode = 'P0001';
    end if;

    if new.status = 'cancelled' then
      if auth.uid() is not null
         and not private.can(new.tenant_id, '{admin,owner,manager,cashier}', new.outlet_id, true) then
        raise exception 'Only a cashier or manager can cancel an order' using errcode = '42501';
      end if;
    elsif (v_rank ->> new.status::text)::int <= (v_rank ->> old.status::text)::int then
      raise exception 'Order cannot go back from % to %', old.status, new.status using errcode = 'P0001';
    elsif new.status = 'served' and new.type = 'delivery' then
      raise exception 'Delivery orders finish as delivered' using errcode = 'P0001';
    elsif new.status = 'delivered' and new.type <> 'delivery' then
      raise exception 'Only delivery orders can be delivered' using errcode = 'P0001';
    end if;

    new.status_changed_at := now();
  end if;

  return new;
end $$;

create trigger before_update before update on public.orders
  for each row execute function private.before_order_update();

-- Order item: fill name/price from the menu when not given, then work out the GST.
create function private.before_order_item_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_inclusive boolean;
  v_default_rate numeric;
  v_gross numeric;
  v_status public.order_status;
begin
  select o.status into v_status from public.orders o where o.id = new.order_id;
  if v_status in ('served', 'delivered', 'cancelled') then
    raise exception 'Order is already %, items cannot change', v_status using errcode = 'P0001';
  end if;

  select t.prices_include_tax into v_inclusive from public.tenants t where t.id = new.tenant_id;
  select r.rate into v_default_rate from public.tax_rates r where r.tenant_id = new.tenant_id and r.is_default;

  if tg_op = 'INSERT' and new.item_id is not null then
    select coalesce(new.name, i.name),
           coalesce(new.unit_price, i.price),
           coalesce((select r.rate from public.tax_rates r where r.id = i.tax_rate_id), v_default_rate, 0)
      into new.name, new.unit_price, new.tax_rate
    from public.menu_items i where i.id = new.item_id and i.tenant_id = new.tenant_id;
  elsif tg_op = 'INSERT' and new.combo_id is not null then
    select coalesce(new.name, c.name),
           coalesce(new.unit_price, c.price),
           coalesce((select r.rate from public.tax_rates r where r.id = c.tax_rate_id), v_default_rate, 0)
      into new.name, new.unit_price, new.tax_rate
    from public.combos c where c.id = new.combo_id and c.tenant_id = new.tenant_id;
  end if;

  if new.name is null or new.unit_price is null then
    raise exception 'Order item needs a menu item or a name and price' using errcode = '23502';
  end if;

  v_gross := new.unit_price * new.quantity;
  if v_inclusive then
    new.line_total := round(v_gross, 2);
    new.line_subtotal := round(v_gross * 100 / (100 + new.tax_rate), 2);
    new.line_tax := new.line_total - new.line_subtotal;
  else
    new.line_subtotal := round(v_gross, 2);
    new.line_tax := round(v_gross * new.tax_rate / 100, 2);
    new.line_total := new.line_subtotal + new.line_tax;
  end if;
  return new;
end $$;

create trigger before_write before insert or update on public.order_items
  for each row execute function private.before_order_item_write();

create function private.recalc_order(p_order uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('private.recalc', 'on', true);
  update public.orders o set
    subtotal = coalesce(s.subtotal, 0), tax_total = coalesce(s.tax, 0), total = coalesce(s.total, 0)
  from (select sum(line_subtotal) subtotal, sum(line_tax) tax, sum(line_total) total
        from public.order_items where order_id = p_order) s
  where o.id = p_order;
  perform set_config('private.recalc', 'off', true);
end $$;

create function private.after_order_item_write() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.recalc_order(coalesce(new.order_id, old.order_id));
  if tg_op = 'UPDATE' and new.order_id is distinct from old.order_id then
    perform private.recalc_order(old.order_id);
  end if;
  return null;
end $$;

create trigger after_write after insert or update or delete on public.order_items
  for each row execute function private.after_order_item_write();

-- New bill: amounts come from the order (discount reduces the taxable value), CGST = SGST = half.
create function private.before_bill_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_tax numeric;
begin
  select * into v_order from public.orders where id = new.order_id and tenant_id = new.tenant_id;
  if v_order.status = 'cancelled' then
    raise exception 'Cannot bill a cancelled order' using errcode = 'P0001';
  end if;
  if new.discount > v_order.subtotal then
    raise exception 'Discount is more than the bill' using errcode = '22023';
  end if;

  update public.outlets set last_bill_no = last_bill_no + 1
  where id = v_order.outlet_id
  returning last_bill_no into new.bill_no;

  new.outlet_id := v_order.outlet_id;
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

create trigger before_insert before insert on public.bills
  for each row execute function private.before_bill_insert();

create function private.before_bill_update() returns trigger
language plpgsql as $$
begin
  if old.is_void then
    raise exception 'Bill #% is already void', old.bill_no using errcode = 'P0001';
  end if;
  return new;
end $$;

create trigger before_update before update on public.bills
  for each row execute function private.before_bill_update();

-- ---------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------

alter table public.dining_tables enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.bills enable row level security;
grant select, insert, update, delete on public.dining_tables, public.orders, public.order_items, public.bills
  to authenticated;
grant all on public.dining_tables, public.orders, public.order_items, public.bills to service_role;
revoke all on public.dining_tables, public.orders, public.order_items, public.bills from anon;

-- Tables: staff of the outlet read; managers of the outlet edit.
create policy dining_tables_read on public.dining_tables for select to authenticated
  using (private.can(tenant_id, private.all_roles(), outlet_id));
create policy dining_tables_write on public.dining_tables for all to authenticated
  using (private.can(tenant_id, '{admin,owner,manager}', outlet_id, true))
  with check (private.can(tenant_id, '{admin,owner,manager}', outlet_id, true));

-- Orders: floor and kitchen staff of the outlet. Delivery riders get their own view in Phase 5.
create policy orders_read on public.orders for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier,waiter,kitchen}', outlet_id));
create policy orders_insert on public.orders for insert to authenticated
  with check (private.can(tenant_id, '{admin,owner,manager,cashier,waiter}', outlet_id, true));
create policy orders_update on public.orders for update to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier,waiter,kitchen}', outlet_id, true))
  with check (private.can(tenant_id, '{admin,owner,manager,cashier,waiter,kitchen}', outlet_id, true));
-- No delete: orders are cancelled, not removed.

create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));
create policy order_items_write on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id
                 and private.can(o.tenant_id, '{admin,owner,manager,cashier,waiter}', o.outlet_id, true)))
  with check (exists (select 1 from public.orders o where o.id = order_id and o.tenant_id = order_items.tenant_id
                      and private.can(o.tenant_id, '{admin,owner,manager,cashier,waiter}', o.outlet_id, true)));

-- Bills: cashiers and managers of the outlet. Only voiding is allowed afterwards.
create policy bills_read on public.bills for select to authenticated
  using (private.can(tenant_id, '{admin,owner,manager,cashier}', outlet_id));
create policy bills_insert on public.bills for insert to authenticated
  with check (private.can(tenant_id, '{admin,owner,manager,cashier}', outlet_id, true));
create policy bills_void on public.bills for update to authenticated
  using (private.can(tenant_id, '{admin,owner,manager}', outlet_id, true))
  with check (private.can(tenant_id, '{admin,owner,manager}', outlet_id, true));

revoke update on public.bills from authenticated;
grant update (is_void, void_reason) on public.bills to authenticated;

-- Live order screens (KDS, order list) listen to changes.
alter publication supabase_realtime add table public.orders, public.order_items;
