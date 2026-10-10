-- Item-wise split bills: one order paid as several GST bills, each for its own items
-- (guests paying for what they ate). Builds on 0003 (bills) and 0006 (settle_bill, numbering).
--
-- Each order item points at the bill it was billed on (order_items.bill_id). One column, so an
-- item is on at most one bill; voiding a bill clears it from its items so they can be billed
-- again. A bill's amounts come from its own items (previously from the whole order), with the
-- same GST maths: discount off the pre-tax amount, tax scaled with it, CGST = SGST = half.
-- settle_bill (0006) keeps its signature and now bills every item not billed yet, so it also
-- settles "the rest" after a split. The order is served (table freed) once every item is billed.

-- ---------------------------------------------------------------------------------------------
-- Items carry their bill
-- ---------------------------------------------------------------------------------------------

alter table public.order_items add column bill_id uuid;
alter table public.order_items
  add constraint order_items_bill_fk foreign key (tenant_id, bill_id) references public.bills (tenant_id, id) on delete set null (bill_id);
create index on public.order_items (bill_id);
create index order_items_unbilled on public.order_items (order_id) where bill_id is null;

-- Several live bills per order are now allowed; the single bill_id column is what stops an item
-- from being billed twice.
drop index public.bills_one_live_per_order;
create index bills_live_by_order on public.bills (order_id) where not is_void;

-- ---------------------------------------------------------------------------------------------
-- Guards on order items
-- ---------------------------------------------------------------------------------------------

-- Replaces 0003's version: unchanged, except that a bill_id-only change made by the billing
-- functions below (private.bill_items = on) skips the checks, so served orders can be stamped.
create or replace function private.before_order_item_write() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_inclusive boolean;
  v_default_rate numeric;
  v_gross numeric;
  v_status public.order_status;
  v_bill uuid;
begin
  if tg_op = 'UPDATE' and current_setting('private.bill_items', true) = 'on' then
    v_bill := new.bill_id;                              -- keep only the bill change
    new := old;
    new.bill_id := v_bill;
    return new;
  end if;

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

-- bill_id is set and cleared only by the billing functions; a billed item cannot be changed or
-- removed until its bill is voided. (Super Admin passes, so deleting a whole business works.)
create function private.guard_order_item_bill() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if current_setting('private.bill_items', true) = 'on' then
    return coalesce(new, old);
  end if;
  if tg_op = 'INSERT' then
    new.bill_id := null;
    return new;
  end if;
  if old.bill_id is not null and auth.uid() is not null and not private.is_super_admin() then
    raise exception 'This item is already billed; void the bill to change it' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' then
    new.bill_id := old.bill_id;
  end if;
  return coalesce(new, old);
end $$;

create trigger guard_bill before insert or update or delete on public.order_items
  for each row execute function private.guard_order_item_bill();

-- Existing bills cover their whole order: stamp their items (one live bill per order until now).
-- Triggers on order_items let a bill_id-only change through while private.bill_items is on.
select set_config('private.bill_items', 'on', true);
update public.order_items i set bill_id = b.id
from public.bills b
where b.order_id = i.order_id and not b.is_void and i.bill_id is null;
select set_config('private.bill_items', 'off', true);

-- ---------------------------------------------------------------------------------------------
-- Bill amounts from the bill's items
-- ---------------------------------------------------------------------------------------------

-- Replaces 0006's version: same checks, numbering and GST split; the amounts now come from the
-- items being billed. Those are the items named in private.bill_item_ids (a split), or every
-- item of the order not billed yet. For an order with no earlier bill that is the whole order,
-- exactly as before.
create or replace function private.before_bill_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_ids uuid[] := nullif(current_setting('private.bill_item_ids', true), '')::uuid[];
  v_subtotal numeric;
  v_tax_total numeric;
  v_tax numeric;
  v_fy text;
begin
  select * into v_order from public.orders where id = new.order_id and tenant_id = new.tenant_id;
  if v_order.status = 'cancelled' then
    raise exception 'Cannot bill a cancelled order' using errcode = 'P0001';
  end if;

  select coalesce(sum(i.line_subtotal), 0), coalesce(sum(i.line_tax), 0) into v_subtotal, v_tax_total
  from public.order_items i
  where i.order_id = new.order_id and i.bill_id is null and (v_ids is null or i.id = any (v_ids));

  if new.discount > v_subtotal then
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
  new.subtotal := v_subtotal;
  new.taxable_amount := v_subtotal - new.discount;
  v_tax := case when v_subtotal = 0 then 0
                else round(v_tax_total * new.taxable_amount / v_subtotal, 2) end;
  new.cgst := round(v_tax / 2, 2);
  new.sgst := v_tax - new.cgst;
  new.total := new.taxable_amount + v_tax;
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.is_void := false;
  new.void_reason := null;
  return new;
end $$;

-- After a bill is made, its items point at it (any insert path: settle_bill, a split, or a
-- direct insert under the 0003 policy).
create function private.after_bill_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_ids uuid[] := nullif(current_setting('private.bill_item_ids', true), '')::uuid[];
begin
  perform set_config('private.bill_items', 'on', true);
  update public.order_items i set bill_id = new.id
  where i.order_id = new.order_id and i.bill_id is null and (v_ids is null or i.id = any (v_ids));
  perform set_config('private.bill_items', 'off', true);
  return null;
end $$;

create trigger after_insert after insert on public.bills
  for each row execute function private.after_bill_insert();

-- Voiding a bill frees its items to be billed again.
create function private.after_bill_void() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.is_void and not old.is_void then
    perform set_config('private.bill_items', 'on', true);
    update public.order_items set bill_id = null where bill_id = new.id;
    perform set_config('private.bill_items', 'off', true);
  end if;
  return null;
end $$;

create trigger after_void after update of is_void on public.bills
  for each row execute function private.after_bill_void();

-- ---------------------------------------------------------------------------------------------
-- Settling
-- ---------------------------------------------------------------------------------------------

-- Shared by settle_bill and settle_split_bill. p_item_ids null = every item not billed yet.
-- p_bill_id: id made on the device (offline outbox); the same call sent twice returns the bill
-- it made the first time.
create function private.settle(p_order uuid, p_bill_id uuid, p_item_ids uuid[], p_discount numeric, p_payments jsonb)
returns public.bills
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_session uuid;
  v_bill public.bills;
  v_paid numeric;
  v_methods int;
  v_payment jsonb;
  v_found int;
begin
  select * into v_order from public.orders where id = p_order for update;
  if v_order.id is null
     or not private.can(v_order.tenant_id, '{admin,owner,manager,cashier}', v_order.outlet_id, true) then
    raise exception 'Order not found' using errcode = '42501';
  end if;

  if p_bill_id is not null then
    select * into v_bill from public.bills where id = p_bill_id;
    if v_bill.id is not null then
      if v_bill.tenant_id = v_order.tenant_id and v_bill.order_id = p_order then
        return v_bill;                                  -- same call again: already settled
      end if;
      raise exception 'Bill id already used' using errcode = '23505';
    end if;
  end if;

  if not exists (select 1 from public.order_items i where i.order_id = p_order) then
    raise exception 'Order #% has no items', v_order.order_no using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.order_items i where i.order_id = p_order and i.bill_id is null) then
    raise exception 'Order #% is already billed', v_order.order_no using errcode = 'P0001';
  end if;

  if p_item_ids is not null then
    if cardinality(p_item_ids) = 0 then
      raise exception 'Pick the items for this bill' using errcode = '22023';
    end if;
    select count(*) into v_found from public.order_items i
    where i.order_id = p_order and i.bill_id is null and i.id = any (p_item_ids);
    if v_found <> (select count(distinct x) from unnest(p_item_ids) x) then
      raise exception 'Some items are not on this order or are already billed' using errcode = '22023';
    end if;
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

  perform set_config('private.bill_item_ids', coalesce(p_item_ids::text, ''), true);
  insert into public.bills (id, tenant_id, outlet_id, order_id, discount, payment_mode, day_session_id)
  values (coalesce(p_bill_id, gen_random_uuid()), v_order.tenant_id, v_order.outlet_id, p_order,
          coalesce(p_discount, 0),
          case when v_methods = 1 then (p_payments -> 0 ->> 'method')::public.payment_mode else 'other' end,
          v_session)
  returning * into v_bill;
  perform set_config('private.bill_item_ids', '', true);

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

  if v_order.type in ('dine_in', 'takeaway') and v_order.status not in ('served', 'delivered')
     and not exists (select 1 from public.order_items i where i.order_id = p_order and i.bill_id is null) then
    update public.orders set status = 'served' where id = p_order;
  end if;
  return v_bill;
end $$;

-- Replaces 0006's version (same signature and result): bills every item not billed yet, so it
-- is also "pay the rest" after a split.
create or replace function public.settle_bill(p_order uuid, p_discount numeric, p_payments jsonb)
returns public.bills
language sql security definer set search_path = '' as $$
  select * from private.settle(p_order, null, null, p_discount, p_payments)
$$;

-- One guest's bill: only the items named, with its own discount and payments.
create function public.settle_split_bill(p_order uuid, p_bill_id uuid, p_item_ids uuid[], p_discount numeric,
                                         p_payments jsonb)
returns public.bills
language plpgsql security definer set search_path = '' as $$
begin
  if p_item_ids is null then
    raise exception 'Pick the items for this bill' using errcode = '22023';
  end if;
  return private.settle(p_order, p_bill_id, p_item_ids, p_discount, p_payments);
end $$;

-- Breaks a line in two so part of it can go on another bill (one of two coffees). The new line
-- keeps the kitchen round, price and GST rate of the original. p_new_id is made on the device;
-- the same call sent twice returns the line it made the first time.
create function public.split_order_item(p_item uuid, p_quantity int, p_new_id uuid)
returns public.order_items
language plpgsql security definer set search_path = '' as $$
declare
  v_item public.order_items;
  v_order public.orders;
  v_new public.order_items;
begin
  select * into v_new from public.order_items where id = p_new_id;
  if v_new.id is not null then
    select * into v_item from public.order_items where id = p_item;
    if v_new.order_id = v_item.order_id and v_new.tenant_id = v_item.tenant_id then
      return v_new;                                     -- same call again
    end if;
    raise exception 'Item id already used' using errcode = '23505';
  end if;

  select * into v_item from public.order_items where id = p_item for update;
  select * into v_order from public.orders where id = v_item.order_id;
  if v_item.id is null
     or not private.can(v_order.tenant_id, '{admin,owner,manager,cashier}', v_order.outlet_id, true) then
    raise exception 'Item not found' using errcode = '42501';
  end if;
  if v_item.bill_id is not null then
    raise exception 'This item is already billed' using errcode = 'P0001';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity >= v_item.quantity then
    raise exception 'Split off between 1 and % of %', v_item.quantity - 1, v_item.name using errcode = '22023';
  end if;

  update public.order_items set quantity = quantity - p_quantity where id = p_item;

  -- Keep the kitchen round (kot_id is otherwise cleared on insert), then restore the GST rate the
  -- original was sold at (an insert takes the menu's current rate).
  perform set_config('private.send_kot', 'on', true);
  insert into public.order_items (id, tenant_id, order_id, item_id, combo_id, name, variant_name, addons,
                                  quantity, unit_price, tax_rate, notes, kot_id, created_at)
  values (p_new_id, v_item.tenant_id, v_item.order_id, v_item.item_id, v_item.combo_id, v_item.name,
          v_item.variant_name, v_item.addons, p_quantity, v_item.unit_price, v_item.tax_rate, v_item.notes,
          v_item.kot_id, v_item.created_at)
  returning * into v_new;
  if v_new.tax_rate is distinct from v_item.tax_rate then
    update public.order_items set tax_rate = v_item.tax_rate where id = p_new_id returning * into v_new;
  end if;
  perform set_config('private.send_kot', 'off', true);
  return v_new;
end $$;

revoke execute on function public.settle_split_bill(uuid, uuid, uuid[], numeric, jsonb),
  public.split_order_item(uuid, int, uuid) from public, anon;
grant execute on function public.settle_split_bill(uuid, uuid, uuid[], numeric, jsonb),
  public.split_order_item(uuid, int, uuid) to authenticated, service_role;
revoke execute on function private.settle(uuid, uuid, uuid[], numeric, jsonb) from public, anon, authenticated;
