import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LeadStore } from '@app/core/lead.store';
import { currentPosition, osmLink } from '@app/core/geolocation';
import { TeamStore } from '@app/core/team.store';
import {
  BILLING,
  BILLING_LABEL,
  PLANS,
  PLAN_LABEL,
  PUNE_AREAS,
  RESTAURANT_TYPES,
  RESTAURANT_TYPE_LABEL,
  SOURCES,
  SOURCE_LABEL,
  STAGES,
  STAGE_LABEL,
  todayIso,
  type Lead,
  type LeadInput,
} from '@app/core/crm';

type Model = LeadInput;

function blank(): Model {
  return {
    restaurantName: '',
    restaurantType: 'cafe',
    ownerName: null,
    phone: null,
    whatsapp: null,
    email: null,
    area: null,
    city: 'Pune',
    address: null,
    mapsUrl: null,
    seats: null,
    outlets: 1,
    currentBilling: 'unknown',
    billingSoftware: null,
    onAggregators: null,
    monthlyAggregatorOrders: null,
    hasWebsite: null,
    hasOwnRiders: null,
    stage: 'new',
    lostReason: null,
    expectedPlan: null,
    source: 'walk_in',
    dealerId: null,
    assignedTo: null,
    nextFollowUpOn: todayIso(1),
    notes: null,
    latitude: null,
    longitude: null,
    locationAccuracyM: null,
  };
}

/** Yes / No / not asked yet, for the qualifying questions. */
export const TRI = [
  { value: null, label: 'Not asked' },
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
] as const;

@Component({
  selector: 'app-lead-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './lead-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeadForm implements OnInit {
  /** Route param; absent on /leads/new. */
  readonly id = input<string>();

  protected readonly store = inject(LeadStore);
  protected readonly team = inject(TeamStore);
  private readonly router = inject(Router);

  protected readonly types = RESTAURANT_TYPES;
  protected readonly typeLabel = RESTAURANT_TYPE_LABEL;
  protected readonly billing = BILLING;
  protected readonly billingLabel = BILLING_LABEL;
  protected readonly sources = SOURCES;
  protected readonly sourceLabel = SOURCE_LABEL;
  protected readonly stages = STAGES;
  protected readonly stageLabel = STAGE_LABEL;
  protected readonly plans = PLANS;
  protected readonly planLabel = PLAN_LABEL;
  protected readonly areas = PUNE_AREAS;
  protected readonly tri = TRI;

  protected readonly model = signal<Model>(blank());
  protected readonly loadError = signal<string | null>(null);
  protected readonly locating = signal(false);
  protected readonly locationError = signal<string | null>(null);
  protected readonly osmLink = osmLink;

  public ngOnInit(): void {
    this.store.clearError();
    this.team.loadUsers();
    this.team.loadDealers();
    const id = this.id();
    if (!id) return;
    const cached = this.store.find(id);
    if (cached) {
      this.fill(cached);
    } else {
      this.store.fetch(id).subscribe({
        next: (lead) => this.fill(lead),
        error: (e: Error) => this.loadError.set(e.message),
      });
    }
  }

  protected set<K extends keyof Model>(key: K, value: Model[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  /** Inputs hand back '' for an empty box; the API wants null for "not given". */
  protected text(key: keyof Model, value: string): void {
    this.set(key, (value.trim() === '' ? null : value) as never);
  }

  protected numberOrNull(key: 'seats' | 'monthlyAggregatorOrders', value: string | number | null): void {
    this.set(key, value === '' || value === null ? null : Number(value));
  }

  /** Fills the location from the device: meant to be tapped while standing at the restaurant. */
  protected useMyLocation(): void {
    this.locating.set(true);
    this.locationError.set(null);
    currentPosition().then(
      (p) => {
        this.model.update((m) => ({ ...m, latitude: p.latitude, longitude: p.longitude, locationAccuracyM: p.accuracyM }));
        this.locating.set(false);
      },
      (e: Error) => {
        this.locationError.set(e.message);
        this.locating.set(false);
      },
    );
  }

  protected clearLocation(): void {
    this.model.update((m) => ({ ...m, latitude: null, longitude: null, locationAccuracyM: null }));
  }

  protected save(): void {
    const m = this.model();
    if (!m.restaurantName.trim()) return;
    const id = this.id();
    if (id) {
      this.store.update(id, m, (ok) => ok && void this.router.navigate(['/leads', id]));
    } else {
      this.store.create(m, (lead) => lead && void this.router.navigate(['/leads', lead.id]));
    }
  }

  private fill(lead: Lead): void {
    const { id: _id, dealerName: _d, assignedName: _a, lastActivityAt: _l, tenantId: _t, convertedAt: _v, createdAt: _c, updatedAt: _u, ...rest } = lead;
    this.model.set(rest);
  }
}
