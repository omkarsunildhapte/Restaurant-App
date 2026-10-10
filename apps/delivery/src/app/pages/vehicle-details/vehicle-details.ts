import { Component, inject, linkedSignal, resource } from '@angular/core';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonSelect } from '@ionic/angular/ion-select';
import { IonSelectOption } from '@ionic/angular/ion-select-option';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { Loader } from '@components/loader/loader';
import { FieldErrors } from '@components/field-errors/field-errors';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { RiderVehicle } from '@appTypes/rider.types';
import { VEHICLE_DETAILS_PAGE } from '@constants/vehicle-details.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';

/** The rider's vehicle (riders.vehicle_type / vehicle_number). Read and save are Phase 5 stubs. */
@Component({
  selector: 'app-vehicle-details',
  imports: [FormRoot, FormField, Loader, FieldErrors, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonInput, IonItem, IonSelect, IonSelectOption, IonTitle, IonToolbar],
  templateUrl: './vehicle-details.html',
  styleUrl: './vehicle-details.css',
})
export class VehicleDetails {
  private readonly auth = inject(AuthService);
  private readonly riders = inject(RiderService);
  private readonly alerts = inject(AlertService);

  readonly page = VEHICLE_DETAILS_PAGE;
  readonly backLink = APP_ROUTE_LINKS.PERSONAL_DOCUMENT;

  /** Saved vehicle, if any (stub resolves null). */
  readonly saved = resource({
    params: () => this.auth.userId() ?? undefined,
    loader: ({ params }) => this.riders.getVehicle(params),
    defaultValue: null,
  });

  /** Form model: resets to the saved vehicle whenever it (re)loads. */
  private readonly model = linkedSignal<RiderVehicle>(() => (this.saved.hasValue() ? this.saved.value() : null) ?? { ...VEHICLE_DETAILS_PAGE.EMPTY_FORM });
  readonly vehicleForm = form(
    this.model,
    (path) => {
      required(path.vehicleType, { message: VALIDATION_MESSAGES.VEHICLE_TYPE_REQUIRED });
      required(path.vehicleNumber, { message: VALIDATION_MESSAGES.VEHICLE_NUMBER_REQUIRED });
    },
    { submission: { action: async (f) => this.save(f().value()) } },
  );

  private async save(value: RiderVehicle): Promise<undefined> {
    try {
      await this.riders.saveVehicle(this.auth.userId() ?? '', value);
      this.saved.reload();
    } catch (error) {
      await this.alerts.saveFailed(VEHICLE_DETAILS_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }
}
