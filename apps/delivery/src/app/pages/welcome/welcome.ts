import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormField, FormRoot, form, minLength, required, validate } from '@angular/forms/signals';
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
import { WelcomeFormState, WelcomeState } from '@appTypes/auth.types';
import { BRAND_LOGO } from '@constants/brand.constants';
import { WELCOME_PAGE } from '@constants/welcome.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';

/**
 * Where a restaurant's rider invite lands (URL /welcome). Riders are invite-only: supabase-js signs
 * the rider in from the link (session in the URL), they choose a password here, then fill in
 * their details. RenderMode.Client: the invite session exists only in the browser.
 */
@Component({
  selector: 'app-welcome',
  imports: [FormRoot, FormField, RouterLink, NgOptimizedImage, Loader, FieldErrors, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonIcon, IonInput, IonItem],
  templateUrl: './welcome.html',
  styleUrl: './welcome.css',
})
export class Welcome {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly navigation = inject(NavigationService);

  readonly logo = BRAND_LOGO;
  readonly links = APP_ROUTE_LINKS;
  readonly state = signal<WelcomeState>('checking');
  readonly email = computed(() => this.auth.email());
  readonly firstName = computed(() => this.auth.displayName().trim().split(/\s+/)[0] ?? '');

  private readonly model = signal<WelcomeFormState>({ ...WELCOME_PAGE.EMPTY_FORM });
  readonly welcomeForm = form(
    this.model,
    (path) => {
      required(path.password, { message: VALIDATION_MESSAGES.PASSWORD_REQUIRED });
      minLength(path.password, WELCOME_PAGE.PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH });
      required(path.confirmPassword, { message: VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED });
      validate(path.confirmPassword, ({ value, valueOf }) => (value() === valueOf(path.password) ? null : { kind: WELCOME_PAGE.PASSWORDS_DIFFER_KIND, message: VALIDATION_MESSAGES.PASSWORDS_MISMATCH }));
    },
    { submission: { action: async (f) => this.save(f().value()) } },
  );

  constructor() {
    afterNextRender(() => void this.waitForSession());
  }

  /** The invite link's session is read by supabase-js as it starts; give it a moment. */
  private async waitForSession(): Promise<void> {
    for (let attempt = 0; attempt < WELCOME_PAGE.SESSION_POLL_ATTEMPTS; attempt++) {
      if (await this.auth.getSession()) {
        this.state.set('ready');
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, WELCOME_PAGE.SESSION_POLL_INTERVAL_MS));
    }
    this.state.set('no-session');
  }

  private async save(value: WelcomeFormState): Promise<undefined> {
    try {
      await this.auth.updatePassword(value.password);
      await this.navigation.root(APP_ROUTE_LINKS.PERSONAL_INFORMATION);
    } catch (error) {
      await this.alerts.presentError(WELCOME_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }
}
