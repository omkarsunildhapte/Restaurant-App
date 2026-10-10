import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { IonButton } from '@ionic/angular/ion-button';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { LoginFormState } from '@appTypes/auth.types';
import { ALERT_TITLES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AlertService } from '@services/alert/alert.service';
import { AuthService } from '@services/auth/auth.service';
import { AuthShell } from '@shared/auth-shell/auth-shell';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { errorMessage } from '@utils/error-message/error-message.util';

/** Email + password sign-in. Users without a phone number go on to add one. */
@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink, IonButton, IonCardSubtitle, IonIcon, IonInput, IonItem, AuthShell, FieldErrors],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly links = APP_ROUTE_LINKS;

  private readonly model = signal<LoginFormState>({ email: '', password: '' });
  readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
      required(path.password, { message: VALIDATION_MESSAGES.PASSWORD_REQUIRED });
    },
    {
      submission: {
        action: async (f) => {
          const { email: address, password } = f().value();
          try {
            const user = await this.auth.login(address, password);
            void this.alerts.present(ALERT_TITLES.LOGIN, SUCCESS_MESSAGES.LOGIN, 'success');
            await this.router.navigateByUrl(user.phone ? APP_ROUTE_LINKS.HOME : APP_ROUTE_LINKS.PHONE_NUMBER);
          } catch (error) {
            void this.alerts.present(ALERT_TITLES.LOGIN_FAILED, errorMessage(error), 'error');
          }
          return undefined;
        },
      },
    },
  );
}
