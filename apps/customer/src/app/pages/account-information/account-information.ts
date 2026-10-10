import { Component, inject, linkedSignal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, FormRoot, email, form, minLength, pattern, required } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonList } from '@ionic/angular/ion-list';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { AccountForm } from '@appTypes/user.types';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION } from '@constants/validation.constants';
import { ToastService } from '@services/toast/toast.service';
import { UserService } from '@services/user/user.service';
import { FieldErrors } from '@shared/field-errors/field-errors';

/** Edit name, email and phone. Saving is a stub until the profiles table is wired. */
@Component({
  selector: 'app-account-information',
  imports: [FormField, FormRoot, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonInput, IonItem, IonList, IonTitle, IonToolbar, FieldErrors],
  templateUrl: './account-information.html',
  styleUrl: './account-information.css',
})
export class AccountInformation {
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly links = APP_ROUTE_LINKS;

  /** Seeded from the signed-in profile; resets if the profile changes. */
  private readonly model = linkedSignal<AccountForm>(() => {
    const p = this.users.profile();
    return { displayName: p?.displayName ?? '', email: p?.email ?? '', phoneNumber: p?.phoneNumber ?? '' };
  });
  readonly accountForm = form(
    this.model,
    (path) => {
      required(path.displayName, { message: VALIDATION_MESSAGES.FULL_NAME_REQUIRED });
      minLength(path.displayName, VALIDATION.NAME_MIN_LENGTH, { message: VALIDATION_MESSAGES.FULL_NAME_MIN_LENGTH });
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
      required(path.phoneNumber, { message: VALIDATION_MESSAGES.PHONE_REQUIRED });
      pattern(path.phoneNumber, VALIDATION.PHONE_PATTERN, { message: VALIDATION_MESSAGES.PHONE_PATTERN });
    },
    {
      submission: {
        action: async (f) => {
          const id = this.users.profile()?.id;
          if (!id) return undefined;
          try {
            await this.users.updateAccount(id, f().value());
            await this.router.navigateByUrl(APP_ROUTE_LINKS.ACCOUNT);
          } catch {
            void this.toast.notConnected();
          }
          return undefined;
        },
      },
    },
  );
}
