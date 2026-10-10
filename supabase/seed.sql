-- Local development data only. Every account's password is: Password123!
--
--   super@platform.test           Super Admin
--   owner@brewleaf.test           Owner, Brew & Leaf Café (Chain plan, 2 outlets)
--   manager.baner@brewleaf.test   Manager, Brew & Leaf Baner only
--   cashier.baner@brewleaf.test   Cashier, Baner
--   waiter.baner@brewleaf.test    Waiter, Baner
--   kitchen.baner@brewleaf.test   Kitchen, Baner
--   manager.kp@brewleaf.test      Manager, Brew & Leaf Koregaon Park only
--   owner@spiceroute.test         Owner, Spice Route Kitchen (Pro plan, trial)

-- ---------------------------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------------------------

create function pg_temp.add_user(p_id uuid, p_email text, p_name text) returns void
language sql as $$
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
          extensions.crypt('Password123!', extensions.gen_salt('bf')), now(),
          '{"provider": "email", "providers": ["email"]}', jsonb_build_object('full_name', p_name),
          now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text,
          jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
          'email', now(), now(), now());
$$;

select pg_temp.add_user('00000000-0000-4000-a000-000000000001', 'super@platform.test', 'Platform Admin');
select pg_temp.add_user('00000000-0000-4000-a000-000000000011', 'owner@brewleaf.test', 'Ananya Kulkarni');
select pg_temp.add_user('00000000-0000-4000-a000-000000000012', 'manager.baner@brewleaf.test', 'Rohit Patil');
select pg_temp.add_user('00000000-0000-4000-a000-000000000013', 'cashier.baner@brewleaf.test', 'Sneha Joshi');
select pg_temp.add_user('00000000-0000-4000-a000-000000000014', 'waiter.baner@brewleaf.test', 'Amit Shinde');
select pg_temp.add_user('00000000-0000-4000-a000-000000000015', 'kitchen.baner@brewleaf.test', 'Ganesh More');
select pg_temp.add_user('00000000-0000-4000-a000-000000000016', 'manager.kp@brewleaf.test', 'Priya Deshmukh');
select pg_temp.add_user('00000000-0000-4000-a000-000000000021', 'owner@spiceroute.test', 'Imran Shaikh');

update public.profiles set is_super_admin = true where email = 'super@platform.test';

-- ---------------------------------------------------------------------------------------------
-- Businesses
-- ---------------------------------------------------------------------------------------------

insert into public.tenants (id, name, slug, legal_name, gstin, fssai_number, phone, email, address,
                            plan_id, status, trial_ends_at) values
  ('10000000-0000-4000-a000-000000000001', 'Brew & Leaf Café', 'brew-and-leaf', 'Brew and Leaf Foods LLP',
   '27AABFB1234C1Z5', '11523999000123', '+91 98220 11111', 'hello@brewleaf.test', 'Baner Road, Pune 411045',
   'chain', 'active', null),
  ('10000000-0000-4000-a000-000000000002', 'Spice Route Kitchen', 'spice-route', null,
   null, null, '+91 98220 22222', 'imran@spiceroute.test', 'Viman Nagar, Pune 411014',
   'pro', 'trial', now() + interval '5 days');

insert into public.tenant_notes (tenant_id, notes) values
  ('10000000-0000-4000-a000-000000000001', 'Pilot café. Wants KDS on a TV in Baner.'),
  ('10000000-0000-4000-a000-000000000002', 'Came from Instagram. Call before trial ends.');

insert into public.outlets (id, tenant_id, name, address, city, phone) values
  ('20000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'Baner', 'Baner Road', 'Pune', '+91 98220 11111'),
  ('20000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'Koregaon Park', 'Lane 6, KP', 'Pune', '+91 98220 11112'),
  ('20000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000002', 'Viman Nagar', 'Phoenix Road', 'Pune', '+91 98220 22222');

insert into public.memberships (tenant_id, user_id, role, outlet_id) values
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000011', 'owner', null),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000012', 'manager', '20000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000013', 'cashier', '20000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000014', 'waiter', '20000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000015', 'kitchen', '20000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000016', 'manager', '20000000-0000-4000-a000-000000000002'),
  ('10000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000021', 'owner', null);

insert into public.invitations (tenant_id, email, role, outlet_id, invited_by) values
  ('10000000-0000-4000-a000-000000000001', 'barista.kp@brewleaf.test', 'cashier',
   '20000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000011');

-- ---------------------------------------------------------------------------------------------
-- Menus
-- ---------------------------------------------------------------------------------------------

insert into public.tax_rates (id, tenant_id, name, rate, is_default) values
  ('30000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'GST 5%', 5, true),
  ('30000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'GST 18%', 18, false),
  ('30000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000002', 'GST 5%', 5, true),
  ('30000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000002', 'No GST', 0, false);

insert into public.menu_categories (id, tenant_id, name, kind, sort_order) values
  ('40000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'Hot Coffee', 'beverage', 1),
  ('40000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'Cold Brews', 'beverage', 2),
  ('40000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000001', 'All-Day Breakfast', 'food', 3),
  ('40000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000001', 'Pizza', 'food', 4),
  ('40000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000001', 'Desserts', 'food', 5),
  ('40000000-0000-4000-a000-000000000011', '10000000-0000-4000-a000-000000000002', 'Starters', 'food', 1),
  ('40000000-0000-4000-a000-000000000012', '10000000-0000-4000-a000-000000000002', 'Main Course', 'food', 2),
  ('40000000-0000-4000-a000-000000000013', '10000000-0000-4000-a000-000000000002', 'Breads', 'food', 3),
  ('40000000-0000-4000-a000-000000000014', '10000000-0000-4000-a000-000000000002', 'Drinks', 'beverage', 4);

insert into public.menu_items (id, tenant_id, category_id, name, description, diet, price, sort_order) values
  ('50000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000001', 'Cappuccino', 'Double shot, steamed milk', 'veg', 180, 1),
  ('50000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000001', 'Café Latte', 'Smooth and milky', 'veg', 190, 2),
  ('50000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000002', 'Iced Americano', null, 'veg', 170, 1),
  ('50000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000002', 'Cold Brew Tonic', null, 'veg', 220, 2),
  ('50000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000003', 'Eggs on Sourdough', 'Scrambled eggs, chives, sourdough', 'egg', 290, 1),
  ('50000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000003', 'Brioche French Toast', 'Berries, maple, mascarpone', 'egg', 320, 2),
  ('50000000-0000-4000-a000-000000000007', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000004', 'Margherita Pizza', 'San Marzano tomato, fior di latte', 'veg', 399, 1),
  ('50000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000004', 'Chicken Pesto Pizza', null, 'non_veg', 469, 2),
  ('50000000-0000-4000-a000-000000000009', '10000000-0000-4000-a000-000000000001', '40000000-0000-4000-a000-000000000005', 'Tiramisu', null, 'egg', 260, 1),
  ('50000000-0000-4000-a000-000000000011', '10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000011', 'Paneer Tikka', null, 'veg', 280, 1),
  ('50000000-0000-4000-a000-000000000012', '10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000011', 'Chicken 65', null, 'non_veg', 310, 2),
  ('50000000-0000-4000-a000-000000000013', '10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000012', 'Dal Makhani', null, 'veg', 260, 1),
  ('50000000-0000-4000-a000-000000000014', '10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000012', 'Butter Chicken', null, 'non_veg', 380, 2),
  ('50000000-0000-4000-a000-000000000015', '10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000013', 'Butter Naan', null, 'veg', 60, 1),
  ('50000000-0000-4000-a000-000000000016', '10000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000014', 'Sweet Lassi', null, 'veg', 90, 1);

-- Example of an item with its own GST rate instead of the default.
update public.menu_items set tax_rate_id = '30000000-0000-4000-a000-000000000004'
where id = '50000000-0000-4000-a000-000000000016';

insert into public.item_variants (tenant_id, item_id, name, price, sort_order) values
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000001', 'Regular', 180, 1),
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000001', 'Large', 220, 2),
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000007', '8 inch', 399, 1),
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000007', '12 inch', 599, 2),
  ('10000000-0000-4000-a000-000000000002', '50000000-0000-4000-a000-000000000013', 'Half', 160, 1),
  ('10000000-0000-4000-a000-000000000002', '50000000-0000-4000-a000-000000000013', 'Full', 260, 2);

insert into public.addon_groups (id, tenant_id, name, min_select, max_select) values
  ('60000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'Milk options', 0, 1),
  ('60000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'Pizza toppings', 0, null);

insert into public.addons (tenant_id, group_id, name, price, sort_order) values
  ('10000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'Oat milk', 50, 1),
  ('10000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001', 'Almond milk', 50, 2),
  ('10000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000002', 'Extra cheese', 60, 1),
  ('10000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000002', 'Jalapeños', 40, 2);

insert into public.item_addon_groups (tenant_id, item_id, group_id) values
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000001', '60000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000002', '60000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000007', '60000000-0000-4000-a000-000000000002'),
  ('10000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000008', '60000000-0000-4000-a000-000000000002');

insert into public.combos (id, tenant_id, name, description, price) values
  ('70000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'Breakfast Combo', 'Eggs on sourdough + cappuccino', 420);
insert into public.combo_items (tenant_id, combo_id, item_id, quantity) values
  ('10000000-0000-4000-a000-000000000001', '70000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000005', 1),
  ('10000000-0000-4000-a000-000000000001', '70000000-0000-4000-a000-000000000001', '50000000-0000-4000-a000-000000000001', 1);

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

insert into public.dining_tables (tenant_id, outlet_id, name, seats, area, sort_order)
select '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', 'T' || n,
       case when n <= 4 then 2 else 4 end, case when n <= 6 then 'Indoor' else 'Patio' end, n
from generate_series(1, 8) n;

insert into public.dining_tables (tenant_id, outlet_id, name, seats, area, sort_order)
select '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', 'K' || n, 4, 'Indoor', n
from generate_series(1, 5) n;

insert into public.dining_tables (tenant_id, outlet_id, name, seats, area, sort_order)
select '10000000-0000-4000-a000-000000000002', '20000000-0000-4000-a000-000000000003', 'Table ' || n, 4, null, n
from generate_series(1, 10) n;

-- ---------------------------------------------------------------------------------------------
-- Two weeks of orders (for reports), a few still open for the order board
-- ---------------------------------------------------------------------------------------------

do $$
declare
  v_outlet record;
  v_order uuid;
  v_items uuid[];
  v_tables uuid[];
  v_type public.order_type;
  v_at timestamptz;
  v_day int;
  v_n int;
  v_status public.order_status;
begin
  perform setseed(0.42);

  for v_outlet in select o.id, o.tenant_id from public.outlets o loop
    select array_agg(id) into v_items from public.menu_items where tenant_id = v_outlet.tenant_id;
    select array_agg(id) into v_tables from public.dining_tables where outlet_id = v_outlet.id;

    for v_day in 0..13 loop
      for v_n in 1..(6 + floor(random() * 10))::int loop
        v_type := (array['dine_in', 'dine_in', 'dine_in', 'takeaway', 'delivery'])[1 + floor(random() * 5)::int];
        -- Busy at breakfast, lunch and dinner, Indian time. Built as a local (zone-less) time and
        -- converted once; assigning it to the timestamptz variable first would shift it by the session zone.
        v_at := (date_trunc('day', now() at time zone 'Asia/Kolkata') - make_interval(days => v_day)
                 + make_interval(hours => (array[9, 10, 13, 13, 14, 19, 20, 21])[1 + floor(random() * 8)::int],
                                 mins => floor(random() * 60)::int)) at time zone 'Asia/Kolkata';
        continue when v_at > now();

        insert into public.orders (tenant_id, outlet_id, type, table_id, created_at)
        values (v_outlet.tenant_id, v_outlet.id, v_type,
                case when v_type = 'dine_in' then v_tables[1 + floor(random() * array_length(v_tables, 1))::int] end,
                v_at)
        returning id into v_order;

        insert into public.order_items (tenant_id, order_id, item_id, quantity)
        select v_outlet.tenant_id, v_order, v_items[1 + floor(random() * array_length(v_items, 1))::int],
               1 + floor(random() * 2)::int
        from generate_series(1, 1 + floor(random() * 4)::int);

        v_status := case
          when v_day = 0 and random() < 0.3 then (array['new', 'preparing', 'ready'])[1 + floor(random() * 3)::int]::public.order_status
          when random() < 0.04 then 'cancelled'
          when v_type = 'delivery' then 'delivered'
          else 'served' end;

        if v_status <> 'new' then
          update public.orders set status = v_status where id = v_order;
        end if;

        if v_status in ('served', 'delivered') then
          insert into public.bills (tenant_id, outlet_id, order_id, payment_mode, paid_at)
          values (v_outlet.tenant_id, v_outlet.id, v_order,
                  (array['cash', 'upi', 'upi', 'card'])[1 + floor(random() * 4)::int]::public.payment_mode,
                  v_at + interval '40 minutes');
        end if;
      end loop;
    end loop;
  end loop;
end $$;
