import { Component, inject, linkedSignal, resource } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { Loader } from '@components/loader/loader';
import { FieldErrors } from '@components/field-errors/field-errors';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { RiderBankDetails } from '@appTypes/rider.types';
import { BANK_DETAILS_PAGE } from '@constants/bank-details.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';

/**
 * Payout details (URL /backing-details). The schema only has riders.upi_id, so the form asks for
 * the UPI ID alone. Read and save are Phase 5 stubs. Payout details are sensitive: never log them.
 */
@Component({
  selector: 'app-bank-details',
  imports: [FormRoot, FormField, Loader, FieldErrors, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonInput, IonItem, IonTitle, IonToolbar],
  templateUrl: './bank-details.html',
  styleUrl: './bank-details.css',
})
export class BankDetails {
  private readonly auth = inject(AuthService);
  private readonly riders = inject(RiderService);
  private readonly alerts = inject(AlertService);

  readonly backLink = APP_ROUTE_LINKS.VEHICLE_DETAILS;

  /** Saved payout details, if any (stub resolves null). */
  readonly saved = resource({
    params: () => this.auth.userId() ?? undefined,
    loader: ({ params }) => this.riders.getBankDetails(params),
    defaultValue: null,
  });

  /** Form model: resets to the saved details whenever they (re)load. */
  private readonly model = linkedSignal<RiderBankDetails>(() => (this.saved.hasValue() ? this.saved.value() : null) ?? { ...BANK_DETAILS_PAGE.EMPTY_FORM });
  readonly bankForm = form(
    this.model,
    (path) => {
      required(path.upiId, { message: VALIDATION_MESSAGES.UPI_REQUIRED });
      pattern(path.upiId, BANK_DETAILS_PAGE.UPI_PATTERN, { message: VALIDATION_MESSAGES.UPI_INVALID });
    },
    { submission: { action: async (f) => this.save(f().value()) } },
  );

  private async save(value: RiderBankDetails): Promise<undefined> {
    try {
      await this.riders.saveBankDetails(this.auth.userId() ?? '', value);
      this.saved.reload();
    } catch (error) {
      await this.alerts.saveFailed(BANK_DETAILS_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }
}
