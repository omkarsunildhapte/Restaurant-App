import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular';
import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { GEOCODE_UNAVAILABLE, GeocodeAddress, GeocodeResult, GeocodeService, OSM_ATTRIBUTION } from 'src/app/core/geocode.service';
import { LocationError, LocationService } from 'src/app/core/location.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';
import { FormsModule } from '@angular/forms';

/** Editable delivery address form; prefilled by "Use my location" or an explicit search. */
export interface AddressForm extends GeocodeAddress {
  line: string;
}

@Component({
    selector: 'app-location',
    templateUrl: './location.page.html',
    styleUrls: ['./location.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonTitle, IonToolbar, FormsModule]
})
export class LocationPage implements OnInit {
  attribution = OSM_ATTRIBUTION;
  userData: any;
  address: AddressForm = emptyAddress();
  /** Search box text; search runs only on button tap or Enter. */
  addressQuery = '';
  results: GeocodeResult[] = [];
  /** True once geocoded data is on screen (attribution must be shown). */
  showAttribution = false;
  message: string | null = null;
  isLocating = false;
  isSearching = false;

  constructor(
    public routerLink: RoutingService,
    private locationService: LocationService,
    private geocodeService: GeocodeService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.userService.getUserByUID(uid).subscribe(
        (data) => {
          this.userData = data;
          this.cdr.markForCheck();
        }
      )
    }
  }

  /** "Use my location": button tap only. One GPS attempt, then one reverse-geocode call. */
  async useMyLocation() {
    if (this.isLocating) return;
    this.isLocating = true;
    this.message = null;
    try {
      const pos = await this.locationService.getCurrentPosition();
      this.geocodeService.reverse(pos.lat, pos.lng).subscribe({
        next: ({ result, attribution }) => {
          this.isLocating = false;
          this.cdr.markForCheck();
          this.attribution = attribution;
          if (result) {
            this.applyResult(result);
          } else {
            this.message = 'No address found for your location. Type your address instead.';
          }
        },
        error: () => {
          this.isLocating = false;
          this.cdr.markForCheck();
          this.message = GEOCODE_UNAVAILABLE + '. Type your address instead.';
        },
      });
    } catch (e) {
      this.isLocating = false;
      this.cdr.markForCheck();
      this.message = e instanceof LocationError ? e.message : 'Could not get your location. Type your address instead.';
    }
  }

  /** Explicit submit only (button / Enter) - never search-as-you-type. */
  searchAddress() {
    const query = this.addressQuery.trim();
    if (!query || this.isSearching) return;
    this.isSearching = true;
    this.message = null;
    this.geocodeService.search(query).subscribe({
      next: ({ results, attribution }) => {
        this.isSearching = false;
        this.cdr.markForCheck();
        this.attribution = attribution;
        this.results = results;
        this.showAttribution = this.showAttribution || results.length > 0;
        if (!results.length) this.message = 'No matching address found. You can type it below.';
      },
      error: () => {
        this.isSearching = false;
        this.cdr.markForCheck();
        this.results = [];
        this.message = GEOCODE_UNAVAILABLE + '. Type your address below.';
      },
    });
  }

  trackByPlace(_i: number, r: GeocodeResult): number {
    return r.placeId;
  }

  selectResult(result: GeocodeResult) {
    this.results = [];
    this.applyResult(result);
  }

  private applyResult(result: GeocodeResult) {
    this.address = { line: result.displayName, ...result.address };
    this.showAttribution = true;
  }
}

function emptyAddress(): AddressForm {
  return { line: '', road: '', suburb: '', city: '', state: '', postcode: '', country: '' };
}
