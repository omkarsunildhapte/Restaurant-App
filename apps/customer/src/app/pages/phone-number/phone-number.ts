import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { PhoneFormState } from '@appTypes/auth.types';
import { ALERT_TITLES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS, QUERY_PARAMS } from '@constants/routes.constants';
import { AlertService } from '@services/alert/alert.service';
import { AuthService } from '@services/auth/auth.service';
import { AuthShell } from '@shared/auth-shell/auth-shell';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { errorMessage } from '@utils/error-message/error-message.util';

/** Sends an SMS OTP to the number (Supabase), then goes to the OTP screen. */
@Component({
  selector: 'app-phone-number',
  imports: [FormField, FormRoot, IonButton, IonIcon, IonInput, IonItem, AuthShell, FieldErrors],
  templateUrl: './phone-number.html',
  styleUrl: './phone-number.css',
})
export class PhoneNumber {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  private readonly model = signal<PhoneFormState>({ phoneNumber: '' });
  readonly phoneForm = form(
    this.model,
    (path) => {
      required(path.phoneNumber, { message: VALIDATION_MESSAGES.PHONE_REQUIRED });
    },
    {
      submission: {
        action: async (f) => {
          const phoneNumber = f().value().phoneNumber;
          const { error } = await this.auth.sendOtp(phoneNumber);
          if (error) {
            void this.alerts.present(ALERT_TITLES.OTP, errorMessage(error), 'error');
            return undefined;
          }
          void this.alerts.present(ALERT_TITLES.OTP, SUCCESS_MESSAGES.OTP_SENT, 'success');
          await this.router.navigate([APP_ROUTE_LINKS.OTP], { queryParams: { [QUERY_PARAMS.PHONE_NUMBER]: phoneNumber } });
          return undefined;
        },
      },
    },
  );
}
