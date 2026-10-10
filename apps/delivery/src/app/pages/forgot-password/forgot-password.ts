import { Component, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
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
import { ForgotPasswordFormState } from '@appTypes/auth.types';
import { BRAND_LOGO } from '@constants/brand.constants';
import { FORGOT_PASSWORD_PAGE } from '@constants/forgot-password.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';

/** Sends a Supabase password-reset e-mail (URL /forget). */
@Component({
  selector: 'app-forgot-password',
  imports: [FormRoot, FormField, RouterLink, NgOptimizedImage, Loader, FieldErrors, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly navigation = inject(NavigationService);

  readonly logo = BRAND_LOGO;
  readonly links = APP_ROUTE_LINKS;

  private readonly model = signal<ForgotPasswordFormState>({ email: '' });
  readonly forgotForm = form(
    this.model,
    (path) => {
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
    },
    { submission: { action: async (f) => this.sendReset(f().value()) } },
  );

  private async sendReset(value: ForgotPasswordFormState): Promise<undefined> {
    try {
      await this.auth.resetPassword(value.email);
      await this.navigation.root(APP_ROUTE_LINKS.LOGIN);
      await this.alerts.presentAlert(FORGOT_PASSWORD_PAGE.ALERT_TITLE, FORGOT_PASSWORD_PAGE.SUCCESS_MESSAGE, 'success');
    } catch (error) {
      await this.alerts.presentError(FORGOT_PASSWORD_PAGE.ALERT_TITLE, error, ERROR_MESSAGES.RESET_FAILED);
    }
    return undefined;
  }
}
