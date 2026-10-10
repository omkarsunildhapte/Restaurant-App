import { Injectable, inject } from '@angular/core';
import { BusinessDb, unwrap, type Tables } from './db';

export type ExpenseMode = Tables<'purchases'>['payment_mode'];
export type PurchaseUnit = Tables<'purchase_items'>['unit'];
export type PayType = Tables<'employee_pay_rates'>['pay_type'];
export type SalaryKind = Tables<'salary_entries'>['kind'];
export type Vendor = Tables<'vendors'>;
export type Employee = Tables<'employees'>;
export type PayRate = Tables<'employee_pay_rates'>;
export type SalaryEntry = Tables<'salary_entries'>;

export interface Purchase extends Tables<'purchases'> {
  purchase_items: Pick<Tables<'purchase_items'>, 'id' | 'item_name' | 'quantity' | 'unit' | 'rate' | 'amount' | 'sort_order'>[];
}

export interface PurchaseInput {
  outlet_id: string;
  purchase_date: string;
  vendor_name: string;
  gst_amount: number;
  payment_mode: ExpenseMode;
  notes: string;
  bill_path: string | null;
  items: { item_name: string; quantity: number; unit: PurchaseUnit; rate: number }[];
}

export interface PurchaseFilter {
  from: string;
  to: string;
  outletId: string | null;
  vendor: string;
  mode: ExpenseMode | '';
  unpaidOnly: boolean;
}

export interface PurchaseSummary {
  count: number;
  total: number;
  gst: number;
  unpaid: number;
  byDay: { day: string; purchases: number; total: number }[];
  byVendor: { vendor: string; purchases: number; total: number; unpaid: number }[];
  byMode: Record<string, number>;
  byItem: { item: string; unit: PurchaseUnit; quantity: number; amount: number; average_rate: number }[];
}

export interface SalaryRow {
  employee_id: string;
  full_name: string;
  job_title: string | null;
  outlet_id: string | null;
  is_active: boolean;
  pay_type: PayType | null;
  rate: number | null;
  due: number;
  advances: number;
  bonus: number;
  deductions: number;
  paid: number;
  balance: number;
}

export interface ItemSuggestion {
  item_name: string;
  unit: PurchaseUnit;
  rate: number;
}

const BILL_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_BILL_BYTES = 5 * 1024 * 1024;

/** Daily purchases (owners, managers) and staff salaries (owners only). RLS enforces both. */
@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly db = inject(BusinessDb);

  // ---- Purchases ----------------------------------------------------------------------------

  async purchases(tenant: string, f: PurchaseFilter): Promise<Purchase[]> {
    let q = this.db.client
      .from('purchases')
      .select('*, purchase_items(id, item_name, quantity, unit, rate, amount, sort_order)')
      .eq('tenant_id', tenant)
      .gte('purchase_date', f.from)
      .lte('purchase_date', f.to)
      .order('purchase_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);
    if (f.outletId) q = q.eq('outlet_id', f.outletId);
    if (f.vendor) q = q.ilike('vendor_name', f.vendor.replace(/[%_]/g, ''));
    if (f.mode) q = q.eq('payment_mode', f.mode);
    if (f.unpaidOnly) q = q.is('paid_at', null);
    const rows = unwrap(await q) as unknown as Purchase[];
    for (const p of rows) p.purchase_items.sort((a, b) => a.sort_order - b.sort_order);
    return rows;
  }

  /** Vendor by name (created on first use), then the purchase and its lines. */
  async addPurchase(tenant: string, input: PurchaseInput): Promise<string> {
    const c = this.db.client;
    const vendorName = input.vendor_name.trim();
    let vendorId: string | null = null;
    if (vendorName) {
      const existing = unwrap(await c.from('vendors').select('id').eq('tenant_id', tenant).ilike('name', vendorName.replace(/[%_]/g, '')).maybeSingle()) as { id: string } | null;
      vendorId = existing?.id ?? (unwrap(await c.from('vendors').insert({ tenant_id: tenant, name: vendorName }).select('id').single()) as { id: string }).id;
    }
    const purchase = unwrap(
      await c
        .from('purchases')
        .insert({
          tenant_id: tenant,
          outlet_id: input.outlet_id,
          purchase_date: input.purchase_date,
          vendor_id: vendorId,
          vendor_name: vendorName || null,
          gst_amount: input.gst_amount || 0,
          payment_mode: input.payment_mode,
          notes: input.notes.trim() || null,
          bill_path: input.bill_path,
        })
        .select('id')
        .single(),
    ) as { id: string };
    const items = input.items.map((i, n) => ({ tenant_id: tenant, purchase_id: purchase.id, ...i, item_name: i.item_name.trim(), sort_order: n + 1 }));
    if (items.length) {
      try {
        unwrap(await c.from('purchase_items').insert(items));
      } catch (e) {
        // Don't leave an empty purchase behind.
        await c.from('purchases').delete().eq('id', purchase.id);
        throw e;
      }
    }
    return purchase.id;
  }

  async deletePurchase(id: string): Promise<void> {
    unwrap(await this.db.client.from('purchases').delete().eq('id', id));
  }

  async markPaid(id: string, mode: ExpenseMode): Promise<void> {
    unwrap(await this.db.client.rpc('mark_purchase_paid', { p_purchase: id, p_mode: mode }));
  }

  async vendors(tenant: string): Promise<Vendor[]> {
    return unwrap(await this.db.client.from('vendors').select('*').eq('tenant_id', tenant).eq('is_active', true).order('name'));
  }

  /** Items bought before, newest first, with the last unit and rate (for the line suggestions). */
  async itemSuggestions(tenant: string): Promise<ItemSuggestion[]> {
    const rows = unwrap(
      await this.db.client
        .from('purchase_items')
        .select('item_name, unit, rate, purchases!inner(purchase_date)')
        .eq('tenant_id', tenant)
        .order('purchase_date', { referencedTable: 'purchases', ascending: false })
        .limit(500),
    ) as unknown as ItemSuggestion[];
    const seen = new Map<string, ItemSuggestion>();
    for (const r of rows) if (!seen.has(r.item_name.toLowerCase())) seen.set(r.item_name.toLowerCase(), { item_name: r.item_name, unit: r.unit, rate: Number(r.rate) });
    return [...seen.values()];
  }

  async summary(tenant: string, from: string, to: string, outlet: string | null): Promise<PurchaseSummary> {
    return unwrap(
      await this.db.client.rpc('purchases_summary', { p_tenant: tenant, p_from: from, p_to: to, p_outlet: outlet ?? undefined }),
    ) as unknown as PurchaseSummary;
  }

  /** Private bucket purchase-bills/<tenant>/<random>.<ext>; returns the storage path. */
  async uploadBill(tenant: string, file: File): Promise<string> {
    if (!BILL_TYPES.includes(file.type)) throw new Error('Use a photo (JPG, PNG, WebP) or a PDF.');
    if (file.size > MAX_BILL_BYTES) throw new Error('The file is larger than 5 MB.');
    const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]!.replace('jpeg', 'jpg');
    const path = `${tenant}/${crypto.randomUUID()}.${ext}`;
    unwrap(await this.db.client.storage.from('purchase-bills').upload(path, file, { contentType: file.type }));
    return path;
  }

  /** Short-lived link to a bill photo (the bucket is private). */
  async billUrl(path: string): Promise<string> {
    const { data, error } = await this.db.client.storage.from('purchase-bills').createSignedUrl(path, 300);
    if (error) throw error;
    return data.signedUrl;
  }

  // ---- Salaries -----------------------------------------------------------------------------

  async salaryMonth(tenant: string, month: string): Promise<SalaryRow[]> {
    return unwrap(await this.db.client.rpc('salary_month', { p_tenant: tenant, p_month: month })) as unknown as SalaryRow[];
  }

  async employees(tenant: string): Promise<(Employee & { employee_pay_rates: PayRate[] })[]> {
    const rows = unwrap(
      await this.db.client.from('employees').select('*, employee_pay_rates(*)').eq('tenant_id', tenant).order('full_name'),
    ) as unknown as (Employee & { employee_pay_rates: PayRate[] })[];
    for (const e of rows) e.employee_pay_rates.sort((a, b) => b.effective_from.localeCompare(a.effective_from));
    return rows;
  }

  async saveEmployee(
    tenant: string,
    id: string | null,
    input: Pick<Employee, 'full_name' | 'job_title' | 'phone' | 'outlet_id' | 'joined_on' | 'left_on' | 'payment_note' | 'is_active'>,
    rate: { pay_type: PayType; rate: number; effective_from: string } | null,
  ): Promise<string> {
    const c = this.db.client;
    const row = {
      ...input,
      full_name: input.full_name.trim(),
      job_title: input.job_title?.trim() || null,
      phone: input.phone?.trim() || null,
      payment_note: input.payment_note?.trim() || null,
    };
    let employeeId = id;
    if (employeeId) unwrap(await c.from('employees').update(row).eq('id', employeeId));
    else employeeId = (unwrap(await c.from('employees').insert({ ...row, tenant_id: tenant }).select('id').single()) as { id: string }).id;
    if (rate) {
      unwrap(
        await c
          .from('employee_pay_rates')
          .upsert({ tenant_id: tenant, employee_id: employeeId, ...rate }, { onConflict: 'employee_id,effective_from' }),
      );
    }
    return employeeId;
  }

  async entries(employeeId: string): Promise<SalaryEntry[]> {
    return unwrap(
      await this.db.client.from('salary_entries').select('*').eq('employee_id', employeeId).order('entry_date', { ascending: false }).order('created_at', { ascending: false }),
    );
  }

  async addEntry(
    tenant: string,
    input: { employee_id: string; kind: SalaryKind; amount: number; period_month: string; entry_date: string; payment_mode: ExpenseMode | null; outlet_id: string | null; note: string },
  ): Promise<void> {
    unwrap(
      await this.db.client.from('salary_entries').insert({
        tenant_id: tenant,
        ...input,
        payment_mode: input.kind === 'deduction' ? null : input.payment_mode,
        outlet_id: input.payment_mode === 'cash' && input.kind !== 'deduction' ? input.outlet_id : null,
        note: input.note.trim() || null,
      }),
    );
  }

  async deleteEntry(id: string): Promise<void> {
    unwrap(await this.db.client.from('salary_entries').delete().eq('id', id));
  }
}
