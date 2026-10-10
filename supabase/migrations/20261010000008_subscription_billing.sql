-- Subscription billing: what each restaurant pays the platform every month (ROADMAP Phase 4).
--
-- How it works:
--   tenant_billing         the monthly price a restaurant pays when it differs from its plan
--                          (founding price, a deal), and who receives the invoice.
--   subscription_invoices  one GST invoice per restaurant per month, numbered per financial
--                          year (SUB/2026-27/0001), raised by raise_subscription_invoices().
--   subscription_payments  money received, recorded by a Super Admin (UPI, bank transfer, cash,
--                          card). An invoice is paid when its payments reach its total.
--   mark_overdue()         restaurants with an unpaid invoice overdue by more than the grace
--                          days become 'past_due'; paying everything moves them back to 'active'.
--   run_billing_cycle()    the daily job: raise this month's invoices, mark overdue restaurants,
--                          suspend expired trials that never paid (after a grace, if set).
--                          Runs nightly with pg_cron where available; also a button for Super Admin.
--   platform_settings      the seller on the invoices (name, GSTIN, state) and the billing rules
--                          (due days, grace days), edited by Super Admin.
--
-- Platform services carry 18% GST, split CGST 9% + SGST 9% (intra-state; inter-state IGST is
-- not handled yet). Only Super Admins write; a restaurant's owner/admin can read its own
-- invoices and payments (for the Business panel's "Plan & billing" page).

-- ---------------------------------------------------------------------------------------------
-- Platform settings (one row)
-- ---------------------------------------------------------------------------------------------

create table public.platform_settings (
  id smallint primary key default 1 check (id = 1),
  seller_name text not null default 'Vernoka Software Technology',
  seller_gstin text check (seller_gstin is null or seller_gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  seller_state text not null default 'Maharashtra',
  seller_address text,
  seller_email citext,
  invoice_due_days int not null default 7 check (invoice_due_days between 0 and 60),
  past_due_after_days int not null default 0 check (past_due_after_days between 0 and 60),
  -- Days after a trial ends before an unpaid restaurant is suspended; null = never automatically.
  trial_grace_days int check (trial_grace_days is null or trial_grace_days between 0 and 90),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (id) values (1);
create trigger touch before update on public.platform_settings for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------------------------
-- Price per restaurant
-- ---------------------------------------------------------------------------------------------

create table public.tenant_billing (
  tenant_id uuid primary key references public.tenants (id) on delete cascade,
  monthly_price numeric(10, 2) check (monthly_price >= 0),   -- null = the plan's price
  is_founding boolean not null default false,
  price_locked_until date,                                   -- founding price holds until this date
  billing_email citext,
  -- No notes column: owners can read this row. Internal notes go in tenant_notes (Super Admin only).
  updated_at timestamptz not null default now()
);
create trigger touch before update on public.tenant_billing for each row execute function private.touch_updated_at();

-- What a restaurant pays per month before GST, today.
create function private.monthly_price(p_tenant uuid) returns numeric
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select b.monthly_price from public.tenant_billing b
     where b.tenant_id = p_tenant and (b.price_locked_until is null or b.price_locked_until >= current_date)),
    (select p.price_monthly from public.tenants t join public.plans p on p.id = t.plan_id where t.id = p_tenant))
$$;

-- ---------------------------------------------------------------------------------------------
-- Invoices and payments
-- ---------------------------------------------------------------------------------------------

create type public.subscription_invoice_status as enum ('open', 'paid', 'void');

create table public.platform_invoice_series (
  financial_year text primary key check (financial_year ~ '^[0-9]{4}-[0-9]{2}$'),
  last_no int not null default 0
);

create table public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  invoice_no text not null unique,                          -- SUB/2026-27/0001
  financial_year text not null,
  period_start date not null,                               -- first day of the month billed
  period_end date not null,
  plan_id text not null references public.plans (id),
  amount numeric(12, 2) not null check (amount >= 0),       -- before GST
  gst_rate numeric(5, 2) not null default 18,
  cgst numeric(12, 2) not null,
  sgst numeric(12, 2) not null,
  total numeric(12, 2) not null,
  status public.subscription_invoice_status not null default 'open',
  -- Seller and buyer as they were when the invoice was raised (a GST invoice never changes).
  seller_name text not null,
  seller_gstin text,
  seller_state text not null,
  buyer_name text not null,
  buyer_gstin text,
  due_on date not null,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  void_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  unique (tenant_id, id),
  check (period_end >= period_start),
  check (status <> 'void' or void_reason is not null)
);
-- One live invoice per restaurant per month.
create unique index subscription_invoices_one_per_month on public.subscription_invoices (tenant_id, period_start) where status <> 'void';
create index on public.subscription_invoices (status, due_on);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  invoice_id uuid not null,
  amount numeric(12, 2) not null check (amount > 0),
  method public.payment_mode not null,
  reference text,
  paid_on date not null default current_date,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, invoice_id) references public.subscription_invoices (tenant_id, id) on delete cascade
);
create index on public.subscription_payments (invoice_id);

create function private.require_super_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not private.is_super_admin() then
    raise exception 'Only a Super Admin can do this' using errcode = '42501';
  end if;
end $$;

-- Raises this month's invoice for every restaurant that is paying (active or past_due) and has
-- none yet. Safe to run more than once: existing invoices are skipped. Returns how many were made.
create function public.raise_subscription_invoices(p_month date default null) returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_start date := date_trunc('month', coalesce(p_month, current_date))::date;
  v_end date := (date_trunc('month', coalesce(p_month, current_date)) + interval '1 month - 1 day')::date;
  v_fy text := private.financial_year(v_start::timestamptz + interval '12 hours', null);
  v_tenant record;
  v_amount numeric;
  v_tax numeric;
  v_no int;
  v_count int := 0;
  v_set public.platform_settings;
begin
  perform private.require_super_admin();
  select * into v_set from public.platform_settings where id = 1;
  for v_tenant in
    select t.id, t.plan_id, coalesce(t.legal_name, t.name) as buyer, t.gstin from public.tenants t
    where t.status in ('active', 'past_due')
      and not exists (select 1 from public.subscription_invoices i
                      where i.tenant_id = t.id and i.period_start = v_start and i.status <> 'void')
    order by t.created_at
  loop
    v_amount := round(private.monthly_price(v_tenant.id), 2);
    v_tax := round(v_amount * 18 / 100, 2);
    insert into public.platform_invoice_series as s (financial_year, last_no) values (v_fy, 1)
    on conflict (financial_year) do update set last_no = s.last_no + 1
    returning s.last_no into v_no;
    insert into public.subscription_invoices
      (tenant_id, invoice_no, financial_year, period_start, period_end, plan_id, amount, cgst, sgst, total, due_on,
       seller_name, seller_gstin, seller_state, buyer_name, buyer_gstin, created_by)
    values
      (v_tenant.id, 'SUB/' || v_fy || '/' || lpad(v_no::text, 4, '0'), v_fy, v_start, v_end, v_tenant.plan_id,
       v_amount, round(v_tax / 2, 2), v_tax - round(v_tax / 2, 2), v_amount + v_tax,
       greatest(v_start, current_date) + v_set.invoice_due_days,
       v_set.seller_name, v_set.seller_gstin, v_set.seller_state, v_tenant.buyer, v_tenant.gstin, auth.uid());
    v_count := v_count + 1;
  end loop;
  return v_count;
end $$;

-- Restaurants with an open invoice overdue by more than the grace days become past_due (they can
-- still use the system; tenant_open keeps past_due writable). Returns how many changed.
create function public.mark_overdue() returns int
language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
  v_grace int := (select s.past_due_after_days from public.platform_settings s where s.id = 1);
begin
  perform private.require_super_admin();
  with late as (
    update public.tenants t set status = 'past_due'
    where t.status = 'active'
      and exists (select 1 from public.subscription_invoices i
                  where i.tenant_id = t.id and i.status = 'open' and i.due_on + v_grace < current_date)
    returning 1)
  select count(*) into v_count from late;
  return v_count;
end $$;

-- Money received against an invoice. When the invoice is fully paid it closes, and a past_due
-- restaurant with nothing else overdue becomes active again.
create function public.record_subscription_payment(
  p_invoice uuid, p_amount numeric, p_method public.payment_mode, p_reference text default null, p_paid_on date default null
) returns public.subscription_invoices
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.subscription_invoices;
  v_paid numeric;
begin
  perform private.require_super_admin();
  select * into v_inv from public.subscription_invoices where id = p_invoice for update;
  if v_inv.id is null then
    raise exception 'Invoice not found' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'open' then
    raise exception 'Invoice % is already %', v_inv.invoice_no, v_inv.status using errcode = 'P0001';
  end if;
  if coalesce(p_amount, 0) <= 0 then
    raise exception 'Payment must be more than zero' using errcode = '22023';
  end if;
  v_paid := coalesce((select sum(p.amount) from public.subscription_payments p where p.invoice_id = p_invoice), 0);
  if v_paid + p_amount > v_inv.total then
    raise exception 'Only % is still due on %', v_inv.total - v_paid, v_inv.invoice_no using errcode = '22023';
  end if;

  insert into public.subscription_payments (tenant_id, invoice_id, amount, method, reference, paid_on, recorded_by)
  values (v_inv.tenant_id, p_invoice, p_amount, p_method, nullif(trim(p_reference), ''), coalesce(p_paid_on, current_date), auth.uid());

  if v_paid + p_amount = v_inv.total then
    update public.subscription_invoices set status = 'paid', paid_at = now() where id = p_invoice returning * into v_inv;
    update public.tenants t set status = 'active'
    where t.id = v_inv.tenant_id and t.status = 'past_due'
      and not exists (select 1 from public.subscription_invoices i
                      where i.tenant_id = t.id and i.status = 'open' and i.due_on < current_date);
  end if;
  return v_inv;
end $$;

-- The daily billing job. Also the Super Admin's "Run billing now" button. Returns what it did.
create function public.run_billing_cycle() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_raised int;
  v_overdue int;
  v_suspended int := 0;
  v_trial_grace int := (select s.trial_grace_days from public.platform_settings s where s.id = 1);
begin
  perform private.require_super_admin();
  v_raised := public.raise_subscription_invoices(null);
  v_overdue := public.mark_overdue();
  if v_trial_grace is not null then
    with gone as (
      update public.tenants t set status = 'suspended'
      where t.status = 'trial' and t.trial_ends_at + make_interval(days => v_trial_grace) < now()
        and not exists (select 1 from public.subscription_payments p where p.tenant_id = t.id)
      returning 1)
    select count(*) into v_suspended from gone;
  end if;
  return jsonb_build_object('invoicesRaised', v_raised, 'markedPastDue', v_overdue, 'trialsSuspended', v_suspended, 'ranAt', now());
end $$;

create function public.void_subscription_invoice(p_invoice uuid, p_reason text) returns public.subscription_invoices
language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.subscription_invoices;
begin
  perform private.require_super_admin();
  if nullif(trim(p_reason), '') is null then
    raise exception 'Say why the invoice is void' using errcode = '22023';
  end if;
  select * into v_inv from public.subscription_invoices where id = p_invoice for update;
  if v_inv.id is null then
    raise exception 'Invoice not found' using errcode = 'P0001';
  end if;
  if v_inv.status <> 'open' then
    raise exception 'Invoice % is already %', v_inv.invoice_no, v_inv.status using errcode = 'P0001';
  end if;
  if exists (select 1 from public.subscription_payments p where p.invoice_id = p_invoice) then
    raise exception 'Invoice % has payments; it cannot be voided', v_inv.invoice_no using errcode = 'P0001';
  end if;
  update public.subscription_invoices set status = 'void', void_reason = trim(p_reason) where id = p_invoice returning * into v_inv;
  return v_inv;
end $$;

-- The numbers for the Super Admin billing page: real MRR from paying restaurants, money still
-- owed, collected this month, and restaurants in trial / past due.
create function public.billing_overview() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_super_admin();
  return jsonb_build_object(
    'mrr', coalesce((select sum(private.monthly_price(t.id)) from public.tenants t where t.status in ('active', 'past_due')), 0),
    'outstanding', coalesce((select sum(i.total - coalesce((select sum(p.amount) from public.subscription_payments p where p.invoice_id = i.id), 0))
                             from public.subscription_invoices i where i.status = 'open'), 0),
    'overdue', coalesce((select sum(i.total) from public.subscription_invoices i where i.status = 'open' and i.due_on < current_date), 0),
    'collectedThisMonth', coalesce((select sum(p.amount) from public.subscription_payments p
                                    where p.paid_on >= date_trunc('month', current_date)), 0),
    'paying', (select count(*) from public.tenants t where t.status in ('active', 'past_due')),
    'pastDue', (select count(*) from public.tenants t where t.status = 'past_due'),
    'inTrial', (select count(*) from public.tenants t where t.status = 'trial'),
    'trialsEndingThisWeek', (select count(*) from public.tenants t
                             where t.status = 'trial' and t.trial_ends_at between now() and now() + interval '7 days'));
end $$;

-- ---------------------------------------------------------------------------------------------
-- Row Level Security and grants
-- ---------------------------------------------------------------------------------------------

alter table public.platform_settings enable row level security;
alter table public.tenant_billing enable row level security;
alter table public.platform_invoice_series enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.subscription_payments enable row level security;

grant select on public.tenant_billing, public.subscription_invoices, public.subscription_payments to authenticated;
grant insert, update on public.tenant_billing to authenticated;
grant all on public.tenant_billing, public.platform_invoice_series, public.subscription_invoices, public.subscription_payments to service_role;
revoke all on public.tenant_billing, public.platform_invoice_series, public.subscription_invoices, public.subscription_payments from anon;
revoke all on public.platform_invoice_series from authenticated;
grant select, update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
revoke all on public.platform_settings from anon;

create policy platform_settings_read on public.platform_settings for select to authenticated using (private.is_super_admin());
create policy platform_settings_update on public.platform_settings for update to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- Prices: Super Admin sets them; the restaurant's owner/admin can see what they pay.
create policy tenant_billing_read on public.tenant_billing for select to authenticated
  using (private.can(tenant_id, '{admin,owner}'));
create policy tenant_billing_write on public.tenant_billing for insert to authenticated
  with check (private.is_super_admin());
create policy tenant_billing_update on public.tenant_billing for update to authenticated
  using (private.is_super_admin()) with check (private.is_super_admin());

-- Invoices and payments: read by Super Admin (private.can lets them through) and the
-- restaurant's owner/admin; written only through the functions above.
create policy subscription_invoices_read on public.subscription_invoices for select to authenticated
  using (private.can(tenant_id, '{admin,owner}'));
create policy subscription_payments_read on public.subscription_payments for select to authenticated
  using (private.can(tenant_id, '{admin,owner}'));

revoke execute on function public.raise_subscription_invoices(date), public.mark_overdue(),
  public.record_subscription_payment(uuid, numeric, public.payment_mode, text, date),
  public.void_subscription_invoice(uuid, text), public.billing_overview(), public.run_billing_cycle() from public, anon;
grant execute on function public.raise_subscription_invoices(date), public.mark_overdue(),
  public.record_subscription_payment(uuid, numeric, public.payment_mode, text, date),
  public.void_subscription_invoice(uuid, text), public.billing_overview(), public.run_billing_cycle() to authenticated, service_role;

-- Nightly at 02:30 India time (21:00 UTC), where pg_cron exists. Elsewhere the Super Admin runs
-- it from the billing page. A failure here must not fail the migration.
do $cron$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('billing-cycle', '0 21 * * *', 'select public.run_billing_cycle()');
  end if;
exception when others then
  raise notice 'pg_cron not scheduled: %', sqlerrm;
end $cron$;
