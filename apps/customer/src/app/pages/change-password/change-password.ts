import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, FormRoot, form, minLength, required, validate } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { ChangePasswordFormState, PasswordField } from '@appTypes/auth.types';
import { ALERT_TITLES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION } from '@constants/validation.constants';
import { AlertService } from '@services/alert/alert.service';
import { AuthService } from '@services/auth/auth.service';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { Loading } from '@shared/loading/loading';
import { errorMessage } from '@utils/error-message/error-message.util';

/** Re-checks the current password, then sets a new one (Supabase). */
@Component({
  selector: 'app-change-password',
  imports: [FormField, FormRoot, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonTitle, IonToolbar, FieldErrors, Loading],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword {
  private readonly auth = inject(AuthService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  readonly links = APP_ROUTE_LINKS;
  /** Which password boxes show their text. */
  readonly visible = signal<Record<PasswordField, boolean>>({ current: false, new: false, confirm: false });

  private readonly model = signal<ChangePasswordFormState>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  readonly passwordForm = form(
    this.model,
    (path) => {
      required(path.currentPassword, { message: VALIDATION_MESSAGES.CURRENT_PASSWORD_REQUIRED });
      required(path.newPassword, { message: VALIDATION_MESSAGES.NEW_PASSWORD_REQUIRED });
      minLength(path.newPassword, VALIDATION.PASSWORD_MIN_LENGTH, { message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH });
      required(path.confirmPassword, { message: VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED });
      validate(path.confirmPassword, ({ value, valueOf }) =>
        value() && value() !== valueOf(path.newPassword) ? { kind: 'mismatch', message: VALIDATION_MESSAGES.PASSWORDS_MUST_MATCH } : null,
      );
    },
    {
      submission: {
        action: async (f) => {
          const { currentPassword, newPassword } = f().value();
          try {
            await this.auth.updatePassword(currentPassword, newPassword);
            await this.router.navigateByUrl(APP_ROUTE_LINKS.ACCOUNT);
          } catch (error) {
            void this.alerts.present(ALERT_TITLES.PASSWORD, errorMessage(error), 'error');
          }
          return undefined;
        },
      },
    },
  );

  toggle(field: PasswordField): void {
    this.visible.update((v) => ({ ...v, [field]: !v[field] }));
  }
}
