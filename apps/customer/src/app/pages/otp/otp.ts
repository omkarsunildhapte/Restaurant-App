import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, FormRoot, form, required } from '@angular/forms/signals';
import { IonButton } from '@ionic/angular/ion-button';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { OtpFormState } from '@appTypes/auth.types';
import { ALERT_TITLES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AlertService } from '@services/alert/alert.service';
import { AuthService } from '@services/auth/auth.service';
import { AuthShell } from '@shared/auth-shell/auth-shell';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { errorMessage } from '@utils/error-message/error-message.util';

/** Verifies the SMS OTP for the number from `?phoneNumber=` (route input), then asks for a delivery address. */
@Component({
  selector: 'app-otp',
  imports: [FormField, FormRoot, IonButton, IonIcon, IonInput, IonItem, AuthShell, FieldErrors],
  templateUrl: './otp.html',
  styleUrl: './otp.css',
})
export class Otp {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  /** From the `phoneNumber` query parameter (withComponentInputBinding). */
  readonly phoneNumber = input<string>('');

  private readonly model = signal<OtpFormState>({ otp: '' });
  readonly otpForm = form(
    this.model,
    (path) => {
      required(path.otp, { message: VALIDATION_MESSAGES.OTP_REQUIRED });
    },
    {
      submission: {
        action: async (f) => {
          const { error } = await this.auth.verifyOtp(this.phoneNumber(), f().value().otp);
          if (error) {
            void this.alerts.present(ALERT_TITLES.OTP, errorMessage(error), 'error');
            return undefined;
          }
          await this.router.navigateByUrl(APP_ROUTE_LINKS.LOCATION);
          return undefined;
        },
      },
    },
  );
}
