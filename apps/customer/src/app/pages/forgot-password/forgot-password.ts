import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { IonButton } from '@ionic/angular/ion-button';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { ForgotPasswordFormState } from '@appTypes/auth.types';
import { ALERT_TITLES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AlertService } from '@services/alert/alert.service';
import { AuthService } from '@services/auth/auth.service';
import { AuthShell } from '@shared/auth-shell/auth-shell';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { errorMessage } from '@utils/error-message/error-message.util';

/** Sends a Supabase password-reset email. */
@Component({
  selector: 'app-forgot-password',
  imports: [FormField, FormRoot, RouterLink, IonButton, IonCardSubtitle, IonIcon, IonInput, IonItem, AuthShell, FieldErrors],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly links = APP_ROUTE_LINKS;

  private readonly model = signal<ForgotPasswordFormState>({ email: '' });
  readonly forgotForm = form(
    this.model,
    (path) => {
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
    },
    {
      submission: {
        action: async (f) => {
          try {
            await this.auth.resetPassword(f().value().email);
            await this.router.navigateByUrl(APP_ROUTE_LINKS.LOGIN);
            void this.alerts.present(ALERT_TITLES.FORGOT_PASSWORD, SUCCESS_MESSAGES.RESET_EMAIL_SENT, 'success');
          } catch (error) {
            void this.alerts.present(ALERT_TITLES.FORGOT_PASSWORD, errorMessage(error), 'error');
          }
          return undefined;
        },
      },
    },
  );
}
