import { Component, computed, inject, linkedSignal, resource } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonDatetime } from '@ionic/angular/ion-datetime';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonModal } from '@ionic/angular/ion-modal';
import { IonSelect } from '@ionic/angular/ion-select';
import { IonSelectOption } from '@ionic/angular/ion-select-option';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import type { DatetimeCustomEvent } from '@ionic/angular';
import { Loader } from '@components/loader/loader';
import { FieldErrors } from '@components/field-errors/field-errors';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { toIsoDate } from '@utils/date/date.util';
import { RiderPersonalInfo } from '@appTypes/rider.types';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';

/** Onboarding step 1: the rider's personal details. Saving is a Phase 5 stub ("Not connected yet"). */
@Component({
  selector: 'app-personal-information',
  imports: [FormRoot, FormField, Loader, FieldErrors, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonDatetime, IonHeader, IonIcon, IonInput, IonItem, IonModal, IonSelect, IonSelectOption, IonTitle, IonToolbar],
  templateUrl: './personal-information.html',
  styleUrl: './personal-information.css',
})
export class PersonalInformation {
  private readonly auth = inject(AuthService);
  private readonly riders = inject(RiderService);
  private readonly alerts = inject(AlertService);
  private readonly navigation = inject(NavigationService);

  readonly page = PERSONAL_INFORMATION_PAGE;
  readonly backLink = APP_ROUTE_LINKS.LOGIN;

  /** What was saved before, if anything (national ID only as its last 4). */
  readonly saved = resource({
    params: () => this.auth.userId() ?? undefined,
    loader: ({ params }) => this.riders.getPersonalInfo(params),
    defaultValue: null,
  });
  readonly savedIdLast4 = computed(() => (this.saved.hasValue() ? (this.saved.value()?.nationalIdLast4 ?? null) : null));

  /** Form model: resets to the saved details whenever they (re)load. */
  private readonly model = linkedSignal<RiderPersonalInfo>(() => (this.saved.hasValue() ? this.saved.value()?.info : null) ?? { ...PERSONAL_INFORMATION_PAGE.EMPTY_FORM });
  readonly personalForm = form(
    this.model,
    (path) => {
      required(path.firstName, { message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED });
      required(path.lastName, { message: VALIDATION_MESSAGES.LAST_NAME_REQUIRED });
      required(path.fathersName, { message: VALIDATION_MESSAGES.FATHERS_NAME_REQUIRED });
      required(path.dateOfBirth, { message: VALIDATION_MESSAGES.DATE_OF_BIRTH_REQUIRED });
      required(path.mobileNumber, { message: VALIDATION_MESSAGES.MOBILE_REQUIRED });
      pattern(path.mobileNumber, PERSONAL_INFORMATION_PAGE.MOBILE_PATTERN, { message: VALIDATION_MESSAGES.MOBILE_PATTERN });
      required(path.bloodGroup, { message: VALIDATION_MESSAGES.BLOOD_GROUP_REQUIRED });
      required(path.city, { message: VALIDATION_MESSAGES.CITY_REQUIRED });
      required(path.address, { message: VALIDATION_MESSAGES.ADDRESS_REQUIRED });
      required(path.deliveryLicenseId, { message: VALIDATION_MESSAGES.DELIVERY_LICENSE_REQUIRED });
      // Once saved, the ID is not sent back; leaving the field empty keeps it.
      required(path.nationalId, { message: VALIDATION_MESSAGES.NATIONAL_ID_REQUIRED, when: () => !this.savedIdLast4() });
    },
    { submission: { action: async (f) => this.save(f().value()) } },
  );

  /** The date picker writes the chosen day (yyyy-MM-dd) into the date field. */
  onDateChange(event: DatetimeCustomEvent): void {
    const value = event.detail.value;
    this.personalForm.dateOfBirth().value.set(toIsoDate(typeof value === 'string' ? value : null));
    this.personalForm.dateOfBirth().markAsTouched();
  }

  private async save(value: RiderPersonalInfo): Promise<undefined> {
    try {
      await this.riders.savePersonalInfo(this.auth.userId() ?? '', value);
      await this.navigation.forward(APP_ROUTE_LINKS.PERSONAL_DOCUMENT);
    } catch (error) {
      await this.alerts.saveFailed(PERSONAL_INFORMATION_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }
}
