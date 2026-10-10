-- Menu: GST rates, categories, items (with variants and add-ons) and combos. All tenant-level:
-- every outlet of a brand shares the menu (per-outlet prices come with chains, Phase 6).

create type public.diet_type as enum ('veg', 'non_veg', 'egg');
create type public.item_kind as enum ('food', 'beverage');

create table public.tax_rates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  rate numeric(5, 2) not null check (rate >= 0 and rate <= 28),   -- total GST %, split CGST/SGST on the bill
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);
create unique index tax_rates_one_default on public.tax_rates (tenant_id) where is_default;

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  kind public.item_kind not null default 'food',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  category_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  description text,
  diet public.diet_type not null default 'veg',
  price numeric(10, 2) not null check (price >= 0),    -- used when the item has no variants
  tax_rate_id uuid,                                     -- null = tenant default rate
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, category_id) references public.menu_categories (tenant_id, id),
  foreign key (tenant_id, tax_rate_id) references public.tax_rates (tenant_id, id) on delete set null (tax_rate_id)
);
create index on public.menu_items (tenant_id, category_id);

-- Sizes / portions (Half, Full, Regular, Large). If present, the variant price replaces item price.
create table public.item_variants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  item_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  price numeric(10, 2) not null check (price >= 0),
  sort_order int not null default 0,
  unique (tenant_id, id),
  unique (item_id, name),
  foreign key (tenant_id, item_id) references public.menu_items (tenant_id, id) on delete cascade
);

-- Add-on groups ("Extra toppings", "Choose a dip") are reusable across items.
create table public.addon_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  min_select int not null default 0 check (min_select >= 0),
  max_select int check (max_select is null or max_select >= 1),   -- null = no limit
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name),
  check (max_select is null or max_select >= min_select)
);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  group_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  price numeric(10, 2) not null default 0 check (price >= 0),
  diet public.diet_type not null default 'veg',
  is_available boolean not null default true,
  sort_order int not null default 0,
  unique (tenant_id, id),
  foreign key (tenant_id, group_id) references public.addon_groups (tenant_id, id) on delete cascade
);

create table public.item_addon_groups (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  item_id uuid not null,
  group_id uuid not null,
  sort_order int not null default 0,
  primary key (item_id, group_id),
  foreign key (tenant_id, item_id) references public.menu_items (tenant_id, id) on delete cascade,
  foreign key (tenant_id, group_id) references public.addon_groups (tenant_id, id) on delete cascade
);

create table public.combos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  price numeric(10, 2) not null check (price >= 0),
  tax_rate_id uuid,
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, tax_rate_id) references public.tax_rates (tenant_id, id) on delete set null (tax_rate_id)
);

create table public.combo_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  combo_id uuid not null,
  item_id uuid not null,
  variant_id uuid,
  quantity int not null default 1 check (quantity > 0),
  foreign key (tenant_id, combo_id) references public.combos (tenant_id, id) on delete cascade,
  foreign key (tenant_id, item_id) references public.menu_items (tenant_id, id) on delete cascade,
  foreign key (tenant_id, variant_id) references public.item_variants (tenant_id, id) on delete set null (variant_id)
);
create index on public.combo_items (combo_id);

create trigger touch before update on public.menu_items for each row execute function private.touch_updated_at();

-- Same access rules on every menu table: all staff read, Admin/Owner/Manager edit.
do $$
declare
  t text;
begin
  foreach t in array array['tax_rates', 'menu_categories', 'menu_items', 'item_variants', 'addon_groups',
                           'addons', 'item_addon_groups', 'combos', 'combo_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('create trigger keep_tenant before update on public.%I for each row execute function private.keep_tenant()', t);
    execute format($p$create policy %I on public.%I for select to authenticated
                     using (private.can(tenant_id, private.all_roles()))$p$, t || '_read', t);
    execute format($p$create policy %I on public.%I for insert to authenticated
                     with check (private.can(tenant_id, '{admin,owner,manager}', null, true))$p$, t || '_insert', t);
    execute format($p$create policy %I on public.%I for update to authenticated
                     using (private.can(tenant_id, '{admin,owner,manager}', null, true))
                     with check (private.can(tenant_id, '{admin,owner,manager}', null, true))$p$, t || '_update', t);
    execute format($p$create policy %I on public.%I for delete to authenticated
                     using (private.can(tenant_id, '{admin,owner,manager}', null, true))$p$, t || '_delete', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------------------------
-- Menu photos: bucket "menu-images", files stored under "<tenant_id>/...".
-- Public read (they end up on the restaurant's website); writes limited to that tenant's managers.
-- ---------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function private.path_tenant(p_name text) returns uuid
language plpgsql stable as $$
begin
  return ((storage.foldername(p_name))[1])::uuid;
exception when invalid_text_representation then
  return null;
end $$;

grant execute on function private.path_tenant(text) to authenticated;

create policy menu_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images'
              and private.can(private.path_tenant(name), '{admin,owner,manager}', null, true));
create policy menu_images_update on storage.objects for update to authenticated
  using (bucket_id = 'menu-images'
         and private.can(private.path_tenant(name), '{admin,owner,manager}', null, true));
create policy menu_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images'
         and private.can(private.path_tenant(name), '{admin,owner,manager}', null, true));
create policy menu_images_select on storage.objects for select to authenticated
  using (bucket_id = 'menu-images'
         and private.can(private.path_tenant(name), private.all_roles()));
