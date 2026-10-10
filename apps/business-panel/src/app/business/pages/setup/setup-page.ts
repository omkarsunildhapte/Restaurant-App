import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/ui/toast.service';
import { BusinessService, type BusinessDetails, type GeocodeResult, type Outlet } from '../../data/business.service';
import { errorText, type TenantRole } from '../../data/db';
import { MenuService } from '../../data/menu.service';
import { ROLE_LABEL, WorkspaceStore } from '../../data/workspace.store';
import { CSV_TEMPLATE, parseMenuCsv, type CsvResult } from './menu-csv';
import { parsePetpoojaCsv, type PetpoojaResult } from './petpooja-csv';

const STEPS = ['Business', 'Outlet', 'Menu', 'Tables', 'Staff', 'Printer'] as const;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

interface QuickItem {
  category: string;
  name: string;
  price: number | null;
  diet: 'veg' | 'egg' | 'non_veg';
}

/** First-run setup for a new restaurant owner. Every step saves on "Next" and can be skipped. */
@Component({
  selector: 'bp-setup-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './setup-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(BusinessService);
  private readonly menu = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly steps = STEPS;
  protected readonly step = signal(0);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly roleLabel = ROLE_LABEL;

  // What exists already, so the wizard shows progress and can be reopened later.
  protected readonly itemCount = signal(0);
  protected readonly tableCount = signal(0);
  protected readonly staffCount = signal(0);

  // 1. Business
  protected readonly details = signal<BusinessDetails | null>(null);
  // 2. Outlet
  protected readonly outlet = signal<Outlet | null>(null);
  protected readonly outletAddress = signal('');
  protected readonly outletCity = signal('');
  protected readonly outletPhone = signal('');
  protected readonly location = signal<GeocodeResult | null>(null);
  protected readonly matches = signal<GeocodeResult[]>([]);
  // 3. Menu
  protected readonly menuMode = signal<'type' | 'file' | 'petpooja'>('type');
  protected readonly quick = signal<QuickItem[]>([
    { category: '', name: '', price: null, diet: 'veg' },
    { category: '', name: '', price: null, diet: 'veg' },
    { category: '', name: '', price: null, diet: 'veg' },
  ]);
  protected readonly csv = signal<CsvResult | null>(null);
  protected readonly petpooja = signal<PetpoojaResult | null>(null);
  protected readonly petpoojaSizes = computed(() => (this.petpooja()?.items ?? []).reduce((n, i) => n + i.variants.length, 0));
  protected readonly petpoojaCategories = computed(() => new Set((this.petpooja()?.items ?? []).map((i) => i.category.toLowerCase())).size);
  protected readonly csvTemplateHref = 'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_TEMPLATE);
  // 4. Tables
  protected readonly tableFrom = signal<number | null>(1);
  protected readonly tableTo = signal<number | null>(8);
  protected readonly tableSeats = signal<number | null>(4);
  // 5. Staff
  protected readonly invites = signal<{ email: string; role: TenantRole }[]>([
    { email: '', role: 'manager' },
    { email: '', role: 'cashier' },
    { email: '', role: 'waiter' },
  ]);
  protected readonly staffRoles: TenantRole[] = ['manager', 'cashier', 'waiter', 'kitchen', 'delivery'];

  protected readonly quickReady = computed(() => this.quick().filter((q) => q.category.trim() && q.name.trim() && q.price !== null && q.price >= 0));

  public ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    try {
      const [t, outlets, items, members] = await Promise.all([
        this.api.tenant(tenant),
        this.api.outlets(tenant),
        this.menu.items(tenant),
        this.api.members(tenant),
      ]);
      this.details.set({
        name: t.name,
        legal_name: t.legal_name ?? '',
        gstin: t.gstin ?? '',
        fssai_number: t.fssai_number ?? '',
        phone: t.phone ?? '',
        email: t.email ?? '',
        address: t.address ?? '',
        prices_include_tax: t.prices_include_tax,
        round_off: t.round_off,
        packaging_charge: Number(t.packaging_charge),
      });
      const first = outlets[0] ?? null;
      this.outlet.set(first);
      this.outletAddress.set(first?.address ?? '');
      this.outletCity.set(first?.city ?? '');
      this.outletPhone.set(first?.phone ?? t.phone ?? '');
      this.itemCount.set(items.length);
      this.staffCount.set(members.length - 1);
      if (first) this.tableCount.set((await this.api.tables(first.id)).length);
    } catch (e) {
      this.error.set(errorText(e));
    }
  }

  protected patchDetails(change: Partial<BusinessDetails>): void {
    this.details.update((d) => (d ? { ...d, ...change } : d));
  }

  protected setQuick(i: number, change: Partial<QuickItem>): void {
    this.quick.update((list) => list.map((q, n) => (n === i ? { ...q, ...change } : q)));
  }

  protected addQuick(): void {
    const last = this.quick().at(-1);
    this.quick.update((list) => [...list, { category: last?.category ?? '', name: '', price: null, diet: 'veg' }]);
  }

  protected addInvite(): void {
    this.invites.update((list) => [...list, { email: '', role: 'waiter' }]);
  }

  protected setInvite(i: number, change: Partial<{ email: string; role: TenantRole }>): void {
    this.invites.update((list) => list.map((x, n) => (n === i ? { ...x, ...change } : x)));
  }

  protected async onCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) {
      this.csv.set({ rows: [], problems: ['The file is larger than 1 MB. Save just the menu sheet as CSV.'] });
      return;
    }
    this.csv.set(parseMenuCsv(await file.text()));
  }

  protected async onPetpooja(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) {
      this.petpooja.set({ items: [], problems: ['This is an Excel file. In Excel use File → Save as → CSV, then choose that file.'], recognised: [] });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.petpooja.set({ items: [], problems: ['The file is larger than 2 MB. Export just the menu.'], recognised: [] });
      return;
    }
    this.petpooja.set(parsePetpoojaCsv(await file.text()));
  }

  protected async findLocation(): Promise<void> {
    const query = [this.outletAddress(), this.outletCity()].filter((x) => x.trim()).join(', ');
    if (!query) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const { results } = await this.api.geocode(query);
      this.matches.set(results.slice(0, 5));
      if (!results.length) this.error.set('No match on the map. You can skip this and set it later under Outlets.');
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected back(): void {
    this.error.set(null);
    this.step.update((s) => Math.max(0, s - 1));
  }

  protected skip(): void {
    this.error.set(null);
    this.step.update((s) => s + 1);
  }

  /** Saves the current step, then moves on. */
  protected async next(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      switch (this.step()) {
        case 0:
          await this.saveBusiness(tenant);
          break;
        case 1:
          await this.saveOutlet(tenant);
          break;
        case 2:
          await this.saveMenu(tenant);
          break;
        case 3:
          await this.saveTables(tenant);
          break;
        case 4:
          await this.sendInvites(tenant);
          break;
        default:
          await this.router.navigateByUrl('/business/dashboard');
          return;
      }
      this.step.update((s) => s + 1);
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  private async saveBusiness(tenant: string): Promise<void> {
    const d = this.details();
    if (!d) return;
    if (!d.name.trim()) throw new Error('The business needs a name.');
    if (d.gstin?.trim() && !GSTIN.test(d.gstin.trim().toUpperCase())) throw new Error('GSTIN should be 15 characters, like 27AABFB1234C1Z5.');
    if (d.fssai_number?.trim() && !/^[0-9]{14}$/.test(d.fssai_number.trim())) throw new Error('FSSAI licence number is 14 digits.');
    await this.api.saveDetails(tenant, d);
  }

  private async saveOutlet(tenant: string): Promise<void> {
    const o = this.outlet();
    if (!o) return;
    const loc = this.location();
    await this.api.saveOutlet(tenant, o.id, {
      name: o.name,
      address: this.outletAddress(),
      city: this.outletCity(),
      phone: this.outletPhone(),
      gstin: o.gstin,
      is_active: o.is_active,
      ...(loc
        ? { latitude: Math.round(loc.lat * 1e6) / 1e6, longitude: Math.round(loc.lng * 1e6) / 1e6, osm_place_id: loc.placeId, geocoded_at: new Date().toISOString() }
        : {}),
    });
    await this.ws.loadOutlets();
  }

  /** Creates missing categories, then the items. Uses the business GST rates for the gst column. */
  private async saveMenu(tenant: string): Promise<void> {
    if (this.menuMode() === 'petpooja') {
      await this.savePetpooja(tenant);
      return;
    }
    const rows =
      this.menuMode() === 'file'
        ? (this.csv()?.rows ?? [])
        : this.quickReady().map((q) => ({ category: q.category.trim(), name: q.name.trim(), price: q.price!, diet: q.diet, gst: null, description: null }));
    if (!rows.length) return;

    const categories = new Map((await this.menu.categories(tenant)).map((c) => [c.name.toLowerCase(), c.id]));
    for (const name of new Set(rows.map((r) => r.category))) {
      if (!categories.has(name.toLowerCase())) {
        const drinks = /drink|beverage|coffee|tea|juice|shake|mocktail|lassi/i.test(name);
        await this.menu.saveCategory(tenant, null, { name, kind: drinks ? 'beverage' : 'food', is_active: true });
      }
    }
    const fresh = new Map((await this.menu.categories(tenant)).map((c) => [c.name.toLowerCase(), c.id]));
    let rates = await this.menu.taxRates(tenant);

    let added = 0;
    for (const r of rows) {
      let taxId: string | null = null;
      if (r.gst !== null) {
        let rate = rates.find((x) => Number(x.rate) === r.gst);
        if (!rate) {
          await this.menu.saveTaxRate(tenant, null, { name: r.gst === 0 ? 'No GST' : `GST ${r.gst}%`, rate: r.gst });
          rates = await this.menu.taxRates(tenant);
          rate = rates.find((x) => Number(x.rate) === r.gst);
        }
        taxId = rate && !rate.is_default ? rate.id : null;
      }
      await this.menu.saveItem(tenant, null, {
        category_id: fresh.get(r.category.toLowerCase())!,
        name: r.name,
        description: r.description,
        diet: r.diet,
        price: r.price,
        tax_rate_id: taxId,
        image_url: null,
        is_available: true,
        variants: [],
        addon_group_ids: [],
      });
      added++;
    }
    this.itemCount.update((n) => n + added);
    this.toast.success(`${added} items added to the menu.`);
  }

  /** Petpooja items, with their sizes, onto categories and GST rates (created when missing). */
  private async savePetpooja(tenant: string): Promise<void> {
    const items = this.petpooja()?.items ?? [];
    if (!items.length) return;
    const known = new Set((await this.menu.categories(tenant)).map((c) => c.name.toLowerCase()));
    for (const name of new Set(items.map((i) => i.category))) {
      if (!known.has(name.toLowerCase())) {
        const drinks = /drink|beverage|coffee|tea|juice|shake|mocktail|lassi|soda|cooler/i.test(name);
        await this.menu.saveCategory(tenant, null, { name, kind: drinks ? 'beverage' : 'food', is_active: true });
        known.add(name.toLowerCase());
      }
    }
    const categories = new Map((await this.menu.categories(tenant)).map((c) => [c.name.toLowerCase(), c.id]));
    let rates = await this.menu.taxRates(tenant);
    let added = 0;
    for (const item of items) {
      let taxId: string | null = null;
      if (item.gst !== null) {
        let rate = rates.find((r) => Number(r.rate) === item.gst);
        if (!rate) {
          await this.menu.saveTaxRate(tenant, null, { name: item.gst === 0 ? 'No GST' : `GST ${item.gst}%`, rate: item.gst });
          rates = await this.menu.taxRates(tenant);
          rate = rates.find((r) => Number(r.rate) === item.gst);
        }
        taxId = rate && !rate.is_default ? rate.id : null;
      }
      await this.menu.saveItem(tenant, null, {
        category_id: categories.get(item.category.toLowerCase())!,
        name: item.name,
        description: item.description,
        diet: item.diet,
        price: item.price,
        tax_rate_id: taxId,
        image_url: null,
        is_available: true,
        variants: item.variants,
        addon_group_ids: [],
      });
      added++;
    }
    this.itemCount.update((n) => n + added);
    this.toast.success(`${added} items imported from Petpooja.`);
  }

  private async saveTables(tenant: string): Promise<void> {
    const outlet = this.outlet();
    const from = Number(this.tableFrom());
    const to = Number(this.tableTo());
    const seats = Number(this.tableSeats());
    if (!outlet || !(to >= from && from >= 0)) return;
    if (to - from >= 100 || !(seats >= 1 && seats <= 50)) throw new Error('Up to 100 tables at once, 1 to 50 seats each.');
    const added = await this.api.addTables(tenant, outlet.id, 'T', from, to, seats, null);
    this.tableCount.update((n) => n + added);
  }

  private async sendInvites(tenant: string): Promise<void> {
    const list = this.invites().filter((i) => i.email.trim());
    const bad = list.find((i) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.email.trim()));
    if (bad) throw new Error(`"${bad.email}" is not a valid email address.`);
    for (const i of list) await this.api.invite(tenant, { email: i.email.trim(), role: i.role, outletId: null });
    if (list.length) {
      this.staffCount.update((n) => n + list.length);
      this.toast.success(`${list.length} invitation${list.length === 1 ? '' : 's'} sent.`);
    }
  }
}
