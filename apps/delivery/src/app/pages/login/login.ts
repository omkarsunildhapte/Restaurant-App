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
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { LoginFormState } from '@appTypes/auth.types';
import { BRAND_LOGO } from '@constants/brand.constants';
import { LOGIN_PAGE } from '@constants/login.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';

/**
 * Rider sign-in (Supabase email + password). Ionic's ion-input binds to Signal Forms through
 * FormField's ControlValueAccessor support (verified in the e2e login spec).
 */
@Component({
  selector: 'app-login',
  imports: [FormRoot, FormField, RouterLink, NgOptimizedImage, Loader, FieldErrors, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly riders = inject(RiderService);
  private readonly alerts = inject(AlertService);
  private readonly navigation = inject(NavigationService);

  readonly logo = BRAND_LOGO;
  readonly links = APP_ROUTE_LINKS;

  private readonly model = signal<LoginFormState>({ email: '', password: '' });
  readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
      required(path.password, { message: VALIDATION_MESSAGES.PASSWORD_REQUIRED });
    },
    { submission: { action: async (f) => this.signIn(f().value()) } },
  );

  /** Signs in, then continues onboarding (no profile yet) or goes to the orders. */
  private async signIn(value: LoginFormState): Promise<undefined> {
    try {
      const session = await this.auth.login(value.email, value.password);
      const profile = await this.riders.getProfile(session.user.id);
      await this.alerts.presentAlert(LOGIN_PAGE.ALERT_TITLE, LOGIN_PAGE.SUCCESS_MESSAGE, 'success');
      await this.navigation.root(profile?.phoneNumber ? APP_ROUTE_LINKS.ORDER : APP_ROUTE_LINKS.PERSONAL_INFORMATION);
    } catch (error) {
      await this.alerts.presentError(LOGIN_PAGE.ALERT_TITLE, error, ERROR_MESSAGES.LOGIN_FAILED);
    }
    return undefined;
  }
}
