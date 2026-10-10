import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { BusinessDb, unwrap, type TenantRole, type TenantStatus } from './db';

export interface Workspace {
  tenant_id: string;
  tenant_name: string;
  tenant_slug: string;
  role: TenantRole;
  /** null = every outlet of the business */
  outlet_id: string | null;
  status: TenantStatus;
  trial_ends_at: string | null;
  plan_id: string;
  features: Record<string, boolean>;
  /** false when the trial has ended: everything is read-only */
  writable: boolean;
}

export interface OutletOption {
  id: string;
  name: string;
  is_active: boolean;
}

const TENANT_KEY = 'bp.tenant';
const OUTLET_KEY = 'bp.outlet';

export const ROLE_LABEL: Record<TenantRole, string> = {
  admin: 'Admin',
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
  waiter: 'Waiter',
  kitchen: 'Kitchen',
  delivery: 'Delivery',
};

function read(browser: boolean, key: string): string | null {
  if (!browser) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(browser: boolean, key: string, value: string | null): void {
  if (!browser) return;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

/**
 * Which business the signed-in person is working in, their role there, and the outlet in view.
 * The database enforces every rule; these flags only decide what the screens offer.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly db = inject(BusinessDb);
  /** Remembered choices live in the browser only (Node has its own localStorage on the server). */
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _workspaces = signal<readonly Workspace[]>([]);
  private readonly _tenantId = signal<string | null>(read(this.browser, TENANT_KEY));
  private readonly _outlets = signal<readonly OutletOption[]>([]);
  private readonly _outletId = signal<string | null>(read(this.browser, OUTLET_KEY));
  private readonly _loaded = signal(false);
  private loading: Promise<void> | null = null;

  readonly workspaces = this._workspaces.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly outlets = this._outlets.asReadonly();

  readonly current = computed<Workspace | null>(() => {
    const list = this._workspaces();
    return list.find((w) => w.tenant_id === this._tenantId()) ?? list[0] ?? null;
  });

  readonly tenantId = computed(() => this.current()?.tenant_id ?? null);
  readonly role = computed(() => this.current()?.role ?? null);
  readonly writable = computed(() => this.current()?.writable ?? false);

  /** Outlets this person may see: one if they are tied to an outlet, otherwise all. */
  readonly visibleOutlets = computed(() => {
    const ws = this.current();
    const all = this._outlets();
    return ws?.outlet_id ? all.filter((o) => o.id === ws.outlet_id) : all;
  });

  /** The outlet in view on outlet-level screens (tables). */
  readonly outletId = computed(() => {
    const visible = this.visibleOutlets();
    return visible.find((o) => o.id === this._outletId())?.id ?? visible[0]?.id ?? null;
  });

  private has(...roles: TenantRole[]) {
    return computed(() => {
      const r = this.role();
      return r !== null && roles.includes(r);
    });
  }

  readonly isOwner = this.has('admin', 'owner');
  readonly isManager = this.has('admin', 'owner', 'manager');
  /** Menu, add-ons, combos, GST rates, tables */
  readonly canEditMenu = computed(() => this.isManager() && this.writable());
  /** Staff, outlets, business details */
  readonly canManage = computed(() => this.isOwner() && this.writable());

  feature(key: string): boolean {
    return this.current()?.features[key] === true;
  }

  /** Loads once per session; call reload() after something changes the list. */
  ensureLoaded(): Promise<void> {
    this.loading ??= this.reload();
    return this.loading;
  }

  async reload(): Promise<void> {
    const rows = unwrap(await this.db.client.rpc('my_workspaces')) as Workspace[];
    this._workspaces.set(rows);
    this._loaded.set(true);
    await this.loadOutlets();
  }

  async loadOutlets(): Promise<void> {
    const tenant = this.tenantId();
    if (!tenant) {
      this._outlets.set([]);
      return;
    }
    const rows = unwrap(
      await this.db.client.from('outlets').select('id, name, is_active').eq('tenant_id', tenant).order('created_at'),
    );
    this._outlets.set(rows);
  }

  async selectTenant(tenantId: string): Promise<void> {
    this._tenantId.set(tenantId);
    write(this.browser, TENANT_KEY, tenantId);
    this._outletId.set(null);
    write(this.browser, OUTLET_KEY, null);
    await this.loadOutlets();
  }

  selectOutlet(outletId: string): void {
    this._outletId.set(outletId);
    write(this.browser, OUTLET_KEY, outletId);
  }

  /** Forget everything on sign-out. */
  clear(): void {
    this._workspaces.set([]);
    this._outlets.set([]);
    this._loaded.set(false);
    this.loading = null;
    this._tenantId.set(null);
    this._outletId.set(null);
    write(this.browser, TENANT_KEY, null);
    write(this.browser, OUTLET_KEY, null);
  }
}
