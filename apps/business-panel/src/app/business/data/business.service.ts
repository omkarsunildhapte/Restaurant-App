import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';
import { BusinessDb, unwrap, type TenantRole, type Tables } from './db';

export type DiningTable = Tables<'dining_tables'>;
export type Outlet = Tables<'outlets'>;
export type Tenant = Tables<'tenants'>;

export interface Member {
  id: string;
  user_id: string;
  role: TenantRole;
  outlet_id: string | null;
  is_active: boolean;
  created_at: string;
  profiles: { email: string | null; full_name: string | null; phone: string | null } | null;
}

export type Invitation = Pick<Tables<'invitations'>, 'id' | 'email' | 'role' | 'outlet_id' | 'created_at' | 'expires_at'>;

export interface BusinessReport {
  orders: number;
  cancelled: number;
  revenue: number;
  tax: number;
  average_order: number;
  by_day: { day: string; orders: number; revenue: number }[];
  by_hour: { hour: number; orders: number; revenue: number }[];
  by_type: Record<string, number>;
  top_items: { name: string; quantity: number; revenue: number }[];
}

export type BusinessDetails = Pick<
  Tenant,
  'name' | 'legal_name' | 'gstin' | 'fssai_number' | 'phone' | 'email' | 'address' | 'prices_include_tax' | 'round_off' | 'packaging_charge'
>;

export type OutletInput = Pick<Outlet, 'name' | 'address' | 'city' | 'phone' | 'gstin' | 'is_active'> &
  Partial<Pick<Outlet, 'latitude' | 'longitude' | 'osm_place_id' | 'geocoded_at'>>;

export interface GeocodeResult {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
}

/** Tables, staff, outlets, business details and reports. RLS decides who may write. */
@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly db = inject(BusinessDb);
  private readonly auth = inject(AuthService);

  // ---- Tables (per outlet) ------------------------------------------------------------------

  async tables(outlet: string): Promise<DiningTable[]> {
    return unwrap(
      await this.db.client.from('dining_tables').select('*').eq('outlet_id', outlet).order('sort_order').order('name'),
    );
  }

  async saveTable(tenant: string, outlet: string, id: string | null, input: { name: string; seats: number; area: string | null; is_active: boolean }) {
    const q = this.db.client.from('dining_tables');
    const row = { ...input, name: input.name.trim(), area: input.area?.trim() || null };
    if (id) {
      unwrap(await q.update(row).eq('id', id));
    } else {
      const { data: last } = await q.select('sort_order').eq('outlet_id', outlet).order('sort_order', { ascending: false }).limit(1);
      unwrap(await q.insert({ ...row, tenant_id: tenant, outlet_id: outlet, sort_order: (last?.[0]?.sort_order ?? 0) + 1 }));
    }
  }

  /** Adds T{from}..T{to} (or another prefix), skipping names that already exist. */
  async addTables(tenant: string, outlet: string, prefix: string, from: number, to: number, seats: number, area: string | null) {
    const current = await this.tables(outlet);
    const existing = new Set(current.map((t) => t.name.toLowerCase()));
    const last = Math.max(0, ...current.map((t) => t.sort_order));
    const rows = [];
    for (let n = from; n <= to; n++) {
      const name = `${prefix}${n}`;
      if (!existing.has(name.toLowerCase())) {
        rows.push({ tenant_id: tenant, outlet_id: outlet, name, seats, area: area?.trim() || null, sort_order: last + rows.length + 1 });
      }
    }
    if (rows.length) unwrap(await this.db.client.from('dining_tables').insert(rows));
    return rows.length;
  }

  async deleteTable(id: string) {
    unwrap(await this.db.client.from('dining_tables').delete().eq('id', id));
  }

  // ---- Staff --------------------------------------------------------------------------------

  async members(tenant: string): Promise<Member[]> {
    return unwrap(
      await this.db.client
        .from('memberships')
        .select('id, user_id, role, outlet_id, is_active, created_at, profiles(email, full_name, phone)')
        .eq('tenant_id', tenant)
        .order('created_at'),
    ) as Member[];
  }

  async invitations(tenant: string): Promise<Invitation[]> {
    return unwrap(
      await this.db.client
        .from('invitations')
        .select('id, email, role, outlet_id, created_at, expires_at')
        .eq('tenant_id', tenant)
        .is('accepted_at', null)
        .order('created_at'),
    );
  }

  async updateMember(id: string, change: Partial<Pick<Member, 'role' | 'outlet_id' | 'is_active'>>) {
    unwrap(await this.db.client.from('memberships').update(change).eq('id', id));
  }

  async removeMember(id: string) {
    unwrap(await this.db.client.from('memberships').delete().eq('id', id));
  }

  async cancelInvitation(id: string) {
    unwrap(await this.db.client.from('invitations').delete().eq('id', id));
  }

  /** Through the API, which sends the invite email. Returns 'added' | 'invited' | 'already_member'. */
  async invite(tenant: string, body: { email: string; role: TenantRole; outletId: string | null; fullName?: string }): Promise<string> {
    const res = await this.api('POST', `/platform/v1/tenants/${tenant}/members`, body);
    return (res as { status: string }).status;
  }

  async resendInvitation(id: string): Promise<void> {
    await this.api('POST', `/platform/v1/invitations/${id}/resend`, {});
  }

  // ---- Outlets ------------------------------------------------------------------------------

  async outlets(tenant: string): Promise<Outlet[]> {
    return unwrap(await this.db.client.from('outlets').select('*').eq('tenant_id', tenant).order('created_at'));
  }

  async saveOutlet(tenant: string, id: string | null, input: OutletInput) {
    const row = {
      ...input,
      name: input.name.trim(),
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      phone: input.phone?.trim() || null,
      gstin: input.gstin?.trim().toUpperCase() || null,
    };
    const q = this.db.client.from('outlets');
    if (id) unwrap(await q.update(row).eq('id', id));
    else unwrap(await q.insert({ ...row, tenant_id: tenant }));
  }

  /** Address search through the backend's shared Nominatim client (1 request/second for the whole app). */
  async geocode(query: string): Promise<{ results: GeocodeResult[]; attribution: string }> {
    return (await this.api('GET', `/geocode/search?q=${encodeURIComponent(query)}`)) as {
      results: GeocodeResult[];
      attribution: string;
    };
  }

  // ---- Business details ---------------------------------------------------------------------

  async tenant(id: string): Promise<Tenant> {
    return unwrap(await this.db.client.from('tenants').select('*').eq('id', id).single());
  }

  async saveDetails(id: string, input: BusinessDetails) {
    unwrap(
      await this.db.client
        .from('tenants')
        .update({
          name: input.name.trim(),
          legal_name: input.legal_name?.trim() || null,
          gstin: input.gstin?.trim().toUpperCase() || null,
          fssai_number: input.fssai_number?.trim() || null,
          phone: input.phone?.trim() || null,
          email: input.email?.trim() || null,
          address: input.address?.trim() || null,
          prices_include_tax: input.prices_include_tax,
          round_off: input.round_off,
          packaging_charge: Number(input.packaging_charge) || 0,
        })
        .eq('id', id),
    );
  }

  // ---- Reports ------------------------------------------------------------------------------

  async report(tenant: string, from: string, to: string, outlet: string | null): Promise<BusinessReport> {
    return unwrap(
      await this.db.client.rpc('business_report', { p_tenant: tenant, p_from: from, p_to: to, p_outlet: outlet ?? undefined }),
    ) as unknown as BusinessReport;
  }

  // ---- API ----------------------------------------------------------------------------------

  private async api(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    const token = this.auth.session()?.access_token;
    let res: Response;
    try {
      res = await fetch(environment.apiUrl + path, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(`Cannot reach the API at ${environment.apiUrl}. Is it running?`);
    }
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
    return json;
  }
}
