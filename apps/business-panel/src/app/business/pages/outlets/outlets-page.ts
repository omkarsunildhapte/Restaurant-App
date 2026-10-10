import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ToastService } from '../../../shared/ui/toast.service';
import { BusinessService, type GeocodeResult, type Outlet } from '../../data/business.service';
import { errorText } from '../../data/db';
import { WorkspaceStore } from '../../data/workspace.store';

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

interface Draft {
  id: string | null;
  name: string;
  address: string;
  city: string;
  phone: string;
  gstin: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  osm_place_id: number | null;
  geocoded_at: string | null;
}

/** Outlets (branches) of the business, with their map location. */
@Component({
  selector: 'bp-outlets-page',
  imports: [FormsModule, ModalComponent],
  templateUrl: './outlets-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OutletsPage implements OnInit {
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(BusinessService);
  private readonly toast = inject(ToastService);

  protected readonly outlets = signal<Outlet[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly editing = signal(false);
  protected readonly draft = signal<Draft | null>(null);
  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly searching = signal(false);
  protected readonly results = signal<GeocodeResult[]>([]);
  protected readonly attribution = signal('');
  protected readonly searchError = signal<string | null>(null);

  protected readonly canAdd = computed(() => this.ws.canManage() && (this.ws.feature('multi_outlet') || this.outlets().length === 0));

  protected readonly problem = computed(() => {
    const d = this.draft();
    if (!d) return null;
    if (!d.name.trim()) return 'Give the outlet a name.';
    if (d.gstin.trim() && !GSTIN.test(d.gstin.trim().toUpperCase())) return 'GSTIN should be 15 characters, like 27AABFB1234C1Z5.';
    return null;
  });

  public ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.outlets.set(await this.api.outlets(tenant));
    } catch (e) {
      this.error.set(errorText(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected mapLink(o: { latitude: number | null; longitude: number | null }): string | null {
    return o.latitude !== null && o.longitude !== null
      ? `https://www.openstreetmap.org/?mlat=${o.latitude}&mlon=${o.longitude}#map=18/${o.latitude}/${o.longitude}`
      : null;
  }

  protected open(o: Outlet | null): void {
    this.draft.set({
      id: o?.id ?? null,
      name: o?.name ?? '',
      address: o?.address ?? '',
      city: o?.city ?? '',
      phone: o?.phone ?? '',
      gstin: o?.gstin ?? '',
      is_active: o?.is_active ?? true,
      latitude: o?.latitude ?? null,
      longitude: o?.longitude ?? null,
      osm_place_id: o?.osm_place_id ?? null,
      geocoded_at: o?.geocoded_at ?? null,
    });
    this.results.set([]);
    this.searchError.set(null);
    this.formError.set(null);
    this.editing.set(true);
  }

  protected patch(change: Partial<Draft>): void {
    this.draft.update((d) => (d ? { ...d, ...change } : d));
  }

  /** One request per click (Nominatim policy: no search-as-you-type). */
  protected async findOnMap(): Promise<void> {
    const d = this.draft();
    const query = [d?.address, d?.city].filter((x) => x?.trim()).join(', ');
    if (!query) {
      this.searchError.set('Type the address and city first.');
      return;
    }
    this.searching.set(true);
    this.searchError.set(null);
    try {
      const { results, attribution } = await this.api.geocode(query);
      this.results.set(results.slice(0, 5));
      this.attribution.set(attribution);
      if (!results.length) this.searchError.set('No match. Try a shorter address, e.g. the road and area.');
    } catch (e) {
      this.searchError.set(errorText(e));
    } finally {
      this.searching.set(false);
    }
  }

  protected pick(r: GeocodeResult): void {
    this.patch({
      latitude: Math.round(r.lat * 1e6) / 1e6,
      longitude: Math.round(r.lng * 1e6) / 1e6,
      osm_place_id: r.placeId,
      geocoded_at: new Date().toISOString(),
    });
    this.results.set([]);
  }

  protected async save(): Promise<void> {
    const d = this.draft();
    const tenant = this.ws.tenantId();
    if (!d || !tenant || this.problem()) return;
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.saveOutlet(tenant, d.id, {
        name: d.name,
        address: d.address,
        city: d.city,
        phone: d.phone,
        gstin: d.gstin,
        is_active: d.is_active,
        latitude: d.latitude,
        longitude: d.longitude,
        osm_place_id: d.osm_place_id,
        geocoded_at: d.geocoded_at,
      });
      this.editing.set(false);
      this.toast.success(`${d.name.trim()} saved.`);
      await Promise.all([this.load(), this.ws.loadOutlets()]);
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }
}
