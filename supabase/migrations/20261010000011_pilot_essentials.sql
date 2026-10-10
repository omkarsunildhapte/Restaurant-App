-- Pilot essentials for the counter (staff app): round-off, packaging charge for takeaway, a
-- sold-out switch for cashiers and the kitchen, and merging two tables into one bill.
-- Builds on 0003 (orders), 0006 (KOTs, day sessions) and 0009 (split bills).

-- ---------------------------------------------------------------------------------------------
-- Settings per business (owner/admin edit them in the Business panel's settings)
-- ---------------------------------------------------------------------------------------------

alter table public.tenants
  add column round_off boolean not null default true,
  -- Added to takeaway orders as a "Packaging" line, at the business's default GST rate (packing
  -- follows the food's rate as part of the same supply). 0 = no packaging charge.
  add column packaging_charge numeric(10, 2) not null default 0 check (packaging_charge >= 0);

-- ---------------------------------------------------------------------------------------------
-- Round-off: bills come to a whole rupee
-- ---------------------------------------------------------------------------------------------

-- CGST/SGST stay computed on the unrounded taxable amount; only the paise difference is stored,
-- so total = taxable_amount + cgst + sgst + round_off.
alter table public.bills
  add column round_off numeric(4, 2) not null default 0 check (round_off between -0.99 and 0.99);

-- Replaces 0009's version: unchanged, plus the round-off at the end.
create or replace function private.before_bill_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_ids uuid[] := nullif(current_setting('private.bill_item_ids', true), '')::uuid[];
  v_subtotal numeric;
  v_tax_total numeric;
  v_tax numeric;
  v_fy text;
  v_exact numeric;
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
  v_exact := new.taxable_amount + v_tax;
  new.round_off := case when (select t.round_off from public.tenants t where t.id = v_order.tenant_id)
                        then round(v_exact) - v_exact else 0 end;
  new.total := v_exact + new.round_off;
  new.created_by := coalesce(auth.uid(), new.created_by);
  new.is_void := false;
  new.void_reason := null;
  return new;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Sold-out switch
-- ---------------------------------------------------------------------------------------------

-- Cashiers and the kitchen can mark a dish sold out (and back) without menu-editing rights.
-- The menu is business-wide, so this applies at every outlet: fine for single-outlet pilot
-- cafés; per-outlet availability needs an outlet_menu_items table later (chains, Phase 6).
create function public.set_item_available(p_item uuid, p_available boolean) returns public.menu_items
language plpgsql security definer set search_path = '' as $$
declare
  v_item public.menu_items;
begin
  select * into v_item from public.menu_items where id = p_item;
  if v_item.id is null
     or not private.can(v_item.tenant_id, '{admin,owner,manager,cashier,kitchen}', null, true) then
    raise exception 'Dish not found' using errcode = '42501';
  end if;
  update public.menu_items set is_available = coalesce(p_available, true) where id = p_item returning * into v_item;
  return v_item;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Merge two tables into one order
-- ---------------------------------------------------------------------------------------------

-- Guests from table A join table B: A's items and kitchen rounds move to B's order (rounds keep
-- their kitchen status and are numbered after B's), B's totals include them, and A's order is
-- cancelled with a note so table A is free. Both must be open dine-in orders at the same outlet
-- with nothing billed yet.
create function public.merge_orders(p_from uuid, p_into uuid) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_from public.orders;
  v_into public.orders;
  v_offset int;
begin
  if p_from = p_into then
    raise exception 'Choose two different tables' using errcode = '22023';
  end if;
  -- Lock both in a fixed order so two cashiers merging at once cannot deadlock.
  perform 1 from public.orders where id in (p_from, p_into) order by id for update;
  select * into v_from from public.orders where id = p_from;
  select * into v_into from public.orders where id = p_into;
  if v_from.id is null or v_into.id is null
     or not private.can(v_into.tenant_id, '{admin,owner,manager,cashier}', v_into.outlet_id, true) then
    raise exception 'Order not found' using errcode = '42501';
  end if;
  if v_from.tenant_id <> v_into.tenant_id or v_from.outlet_id <> v_into.outlet_id then
    raise exception 'Both tables must be at the same outlet' using errcode = '22023';
  end if;
  if v_from.type <> 'dine_in' or v_into.type <> 'dine_in' then
    raise exception 'Only table orders can be merged' using errcode = '22023';
  end if;
  if v_from.status in ('served', 'delivered', 'cancelled') or v_into.status in ('served', 'delivered', 'cancelled') then
    raise exception 'Both orders must still be open' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.bills b where b.order_id in (p_from, p_into) and not b.is_void)
     or exists (select 1 from public.order_items i where i.order_id in (p_from, p_into) and i.bill_id is not null) then
    raise exception 'A bill has already been made on one of these orders' using errcode = 'P0001';
  end if;

  -- Kitchen rounds follow the items, renumbered after the target's own rounds.
  v_offset := coalesce((select max(k.round_no) from public.kots k where k.order_id = p_into), 0);
  perform set_config('private.merge_orders', 'on', true);
  update public.kots set order_id = p_into, round_no = round_no + v_offset where order_id = p_from;
  perform set_config('private.merge_orders', 'off', true);

  -- The sent-item guard (0006) is for staff editing by hand; this is a move. (Not
  -- private.bill_items: 0009 uses it to change only bill_id, which would undo the move.)
  perform set_config('private.send_kot', 'on', true);
  update public.order_items set order_id = p_into where order_id = p_from;
  perform set_config('private.send_kot', 'off', true);

  perform private.recalc_order(p_into);
  perform private.recalc_order(p_from);
  update public.orders
     set status = 'cancelled',
         notes = trim(coalesce(notes || E'\n', '') || 'Merged into order #' || v_into.order_no)
   where id = p_from;

  select * into v_into from public.orders where id = p_into;
  return v_into;
end $$;

-- KOT updates are guarded (0006 before_kot_update keeps order_id/round_no). Let merge_orders
-- through: same function, plus a session flag set only by merge_orders.
create or replace function private.before_kot_update() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rank constant jsonb := '{"new": 0, "preparing": 1, "ready": 2, "served": 3}';
begin
  if current_setting('private.merge_orders', true) is distinct from 'on' then
    new.order_id := old.order_id;
    new.round_no := old.round_no;
  end if;
  new.outlet_id := old.outlet_id;
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

grant execute on function public.set_item_available(uuid, boolean), public.merge_orders(uuid, uuid) to authenticated, service_role;
revoke execute on function public.set_item_available(uuid, boolean), public.merge_orders(uuid, uuid) from public, anon;
