import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonList } from '@ionic/angular/ion-list';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { AddressForm, AddressSearchForm, GeocodeResult } from '@appTypes/geocode.types';
import { DevicePosition } from '@appTypes/location.types';
import { DELIVERY_LOCATION_PAGE } from '@constants/delivery-location.constants';
import { GEOCODE } from '@constants/geocode.constants';
import { LOCATION_MESSAGES } from '@constants/location.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { GeocodeService } from '@services/geocode/geocode.service';
import { LocationService } from '@services/location/location.service';
import { LocationError } from '@utils/location-error/location-error.util';

const toAddress = (r: GeocodeResult | null): AddressForm =>
  r
    ? { line: r.displayName, road: r.address.road ?? '', suburb: r.address.suburb ?? '', city: r.address.city ?? '', state: r.address.state ?? '', postcode: r.address.postcode ?? '', country: r.address.country ?? '' }
    : { ...DELIVERY_LOCATION_PAGE.EMPTY_ADDRESS };

/**
 * Delivery address: "Use my location" (one GPS read + one backend reverse-geocode) or an explicit
 * search (button / Enter only, never per keystroke). Results prefill an editable form; any lookup
 * failure leaves the form open for typing. OSM attribution is shown next to geocoded data.
 */
@Component({
  selector: 'app-delivery-location',
  imports: [FormField, FormRoot, RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar],
  templateUrl: './delivery-location.html',
  styleUrl: './delivery-location.css',
})
export class DeliveryLocation {
  private readonly geocode = inject(GeocodeService);
  private readonly location = inject(LocationService);

  readonly copy = DELIVERY_LOCATION_PAGE;
  readonly links = APP_ROUTE_LINKS;

  /** GPS read in progress (a device call, not a fetch). */
  readonly locating = signal(false);
  private readonly gpsError = signal<string | null>(null);
  private readonly position = signal<DevicePosition | undefined>(undefined);
  private readonly submittedQuery = signal<string | undefined>(undefined);
  private readonly picked = signal<GeocodeResult | null>(null);

  readonly reverse = rxResource({ params: () => this.position(), stream: ({ params }) => this.geocode.reverse(params.lat, params.lng) });
  readonly search = rxResource({ params: () => this.submittedQuery(), stream: ({ params }) => this.geocode.search(params) });

  private readonly reversed = computed(() => (this.reverse.hasValue() ? this.reverse.value().result : null));
  readonly results = computed<GeocodeResult[]>(() => (!this.picked() && this.search.hasValue() ? this.search.value().results : []));
  readonly busy = computed(() => this.locating() || this.reverse.isLoading());
  readonly attribution = computed(() => {
    if (this.search.hasValue() && (this.results().length || this.picked())) return this.search.value().attribution;
    if (this.reverse.hasValue() && this.reversed()) return this.reverse.value().attribution;
    return null;
  });
  readonly message = computed(() => {
    if (this.gpsError()) return this.gpsError();
    if (this.reverse.error()) return DELIVERY_LOCATION_PAGE.LOOKUP_UNAVAILABLE_TYPE_INSTEAD;
    if (this.reverse.hasValue() && !this.reversed()) return DELIVERY_LOCATION_PAGE.NO_ADDRESS_FOR_POSITION;
    if (this.search.error()) return DELIVERY_LOCATION_PAGE.LOOKUP_UNAVAILABLE_TYPE_BELOW;
    if (this.search.hasValue() && !this.search.value().results.length) return DELIVERY_LOCATION_PAGE.NO_MATCH;
    return null;
  });

  private readonly searchModel = signal<AddressSearchForm>({ query: '' });
  readonly searchForm = form(this.searchModel, {
    submission: {
      action: async (f) => {
        const query = f().value().query.trim();
        if (!query) return undefined;
        this.picked.set(null);
        this.gpsError.set(null);
        if (this.submittedQuery() === query) this.search.reload();
        else this.submittedQuery.set(query);
        return undefined;
      },
    },
  });

  /** Editable address, prefilled from the latest picked/reverse-geocoded result. */
  private readonly addressModel = linkedSignal<AddressForm>(() => toAddress(this.picked() ?? this.reversed()));
  readonly addressForm = form(this.addressModel);

  /** Button tap only: one GPS attempt, then one reverse-geocode request. */
  async useMyLocation(): Promise<void> {
    if (this.busy()) return;
    this.locating.set(true);
    this.gpsError.set(null);
    this.picked.set(null);
    try {
      this.position.set(await this.location.getCurrentPosition());
    } catch (e) {
      this.gpsError.set(e instanceof LocationError ? e.message : LOCATION_MESSAGES.unknown);
    } finally {
      this.locating.set(false);
    }
  }

  select(result: GeocodeResult): void {
    this.position.set(undefined);
    this.picked.set(result);
  }

  readonly osmFallback = GEOCODE.OSM_ATTRIBUTION;
}
