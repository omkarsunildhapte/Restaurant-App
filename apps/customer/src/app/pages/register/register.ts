import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, minLength, required, validate } from '@angular/forms/signals';
import { IonButton } from '@ionic/angular/ion-button';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { RegisterFormState } from '@appTypes/auth.types';
import { ALERT_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { AUTH_ERROR_CODES } from '@constants/supabase.constants';
import { VALIDATION } from '@constants/validation.constants';
import { AlertService } from '@services/alert/alert.service';
import { AuthService } from '@services/auth/auth.service';
import { AuthShell } from '@shared/auth-shell/auth-shell';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { errorCode, errorMessage } from '@utils/error-message/error-message.util';

const EMAIL_TAKEN: readonly string[] = [AUTH_ERROR_CODES.USER_ALREADY_EXISTS, AUTH_ERROR_CODES.EMAIL_EXISTS];

/** Email + password sign-up; goes back to login on success. */
@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot, RouterLink, IonButton, IonCardSubtitle, IonIcon, IonInput, IonItem, AuthShell, FieldErrors],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly links = APP_ROUTE_LINKS;

  private readonly model = signal<RegisterFormState>({ name: '', email: '', password: '', confirmPassword: '' });
  readonly registerForm = form(
    this.model,
    (path) => {
      required(path.name, { message: VALIDATION_MESSAGES.NAME_REQUIRED });
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
      required(path.password, { message: VALIDATION_MESSAGES.PASSWORD_REQUIRED });
      minLength(path.password, VALIDATION.PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH });
      required(path.confirmPassword, { message: VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED });
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(path.password) ? { kind: 'mismatch', message: VALIDATION_MESSAGES.PASSWORDS_MUST_MATCH } : null,
      );
    },
    {
      submission: {
        action: async (f) => {
          const { name, email: address, password } = f().value();
          try {
            await this.auth.register(name, address, password);
            await this.router.navigateByUrl(APP_ROUTE_LINKS.LOGIN);
            void this.alerts.present(ALERT_TITLES.REGISTRATION_SUCCESS, SUCCESS_MESSAGES.REGISTERED, 'success');
          } catch (error) {
            const code = errorCode(error);
            const message = code && EMAIL_TAKEN.includes(code) ? ERROR_MESSAGES.EMAIL_IN_USE : errorMessage(error);
            void this.alerts.present(ALERT_TITLES.REGISTRATION_FAILED, message, 'error');
          }
          return undefined;
        },
      },
    },
  );
}
