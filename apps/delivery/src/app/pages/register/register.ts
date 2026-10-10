import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, minLength, required, validate } from '@angular/forms/signals';
import { IonButton } from '@ionic/angular/ion-button';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardSubtitle } from '@ionic/angular/ion-card-subtitle';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonContent } from '@ionic/angular/ion-content';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { Loader } from '@components/loader/loader';
import { FieldErrors } from '@components/field-errors/field-errors';
import { AuthService } from '@services/auth/auth.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { errorMessage } from '@utils/errors/errors.util';
import { RegisterFormState } from '@appTypes/auth.types';
import { BRAND_LOGO } from '@constants/brand.constants';
import { REGISTER_PAGE } from '@constants/register.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';

/** Rider sign-up (Supabase). With e-mail confirmation off, the new session continues onboarding. */
@Component({
  selector: 'app-register',
  imports: [FormRoot, FormField, RouterLink, NgOptimizedImage, Loader, FieldErrors, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly navigation = inject(NavigationService);

  readonly logo = BRAND_LOGO;
  readonly links = APP_ROUTE_LINKS;

  private readonly model = signal<RegisterFormState>({ name: '', email: '', password: '', confirmPassword: '' });
  readonly registerForm = form(
    this.model,
    (path) => {
      required(path.name, { message: VALIDATION_MESSAGES.NAME_REQUIRED });
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
      required(path.password, { message: VALIDATION_MESSAGES.PASSWORD_REQUIRED });
      minLength(path.password, REGISTER_PAGE.PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH });
      required(path.confirmPassword, { message: VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED });
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(path.password) ? { kind: 'mismatch', message: VALIDATION_MESSAGES.PASSWORDS_MISMATCH } : undefined,
      );
    },
    { submission: { action: async (f) => this.signUp(f().value()) } },
  );

  private async signUp(value: RegisterFormState): Promise<undefined> {
    try {
      await this.auth.register(value.name, value.email, value.password);
      await this.navigation.forward(APP_ROUTE_LINKS.PERSONAL_INFORMATION);
      await this.alerts.presentAlert(REGISTER_PAGE.SUCCESS_TITLE, REGISTER_PAGE.SUCCESS_MESSAGE, 'success');
    } catch (error) {
      const message = this.auth.isEmailInUse(error) ? ERROR_MESSAGES.EMAIL_IN_USE : errorMessage(error, ERROR_MESSAGES.REGISTRATION_FAILED);
      await this.alerts.presentAlert(REGISTER_PAGE.FAILURE_TITLE, message, 'error');
    }
    return undefined;
  }
}
