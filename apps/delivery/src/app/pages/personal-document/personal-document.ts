import { Component, inject, linkedSignal, resource } from '@angular/core';
import { FormRoot, form, required } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { Loader } from '@components/loader/loader';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { firstPickedFile, readAsDataUrl } from '@utils/file/file.util';
import { RiderDocumentKey, RiderDocuments } from '@appTypes/rider.types';
import { PERSONAL_DOCUMENT_PAGE } from '@constants/personal-document.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';

/**
 * Onboarding step 2: profile photo, driving licence and national ID images (data URLs).
 * The file inputs are not bound with FormField (Signal Forms has no file control); each change
 * writes the image into its field. Saved photos load back as short-lived signed URLs; only newly
 * picked ones are uploaded (shrunk, to the rider's private folder). Images are sensitive: never log them.
 */
@Component({
  selector: 'app-personal-document',
  imports: [FormRoot, Loader, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
  templateUrl: './personal-document.html',
  styleUrl: './personal-document.css',
})
export class PersonalDocument {
  private readonly auth = inject(AuthService);
  private readonly riders = inject(RiderService);
  private readonly alerts = inject(AlertService);
  private readonly navigation = inject(NavigationService);

  readonly page = PERSONAL_DOCUMENT_PAGE;
  readonly backLink = APP_ROUTE_LINKS.PERSONAL_INFORMATION;

  /** Photos saved before, as signed URLs ('' where none). */
  readonly saved = resource({
    params: () => this.auth.userId() ?? undefined,
    loader: ({ params }) => this.riders.getDocuments(params),
    defaultValue: null,
  });

  /** Form model: resets to the saved photos whenever they (re)load. */
  private readonly model = linkedSignal<RiderDocuments>(() => (this.saved.hasValue() ? this.saved.value() : null) ?? { profile: '', drivingLicence: '', nationalId: '' });
  readonly documentForm = form(
    this.model,
    (path) => {
      required(path.profile, { message: VALIDATION_MESSAGES.DOCUMENT_PROFILE_REQUIRED });
      required(path.drivingLicence, { message: VALIDATION_MESSAGES.DOCUMENT_LICENCE_REQUIRED });
      required(path.nationalId, { message: VALIDATION_MESSAGES.DOCUMENT_NATIONAL_ID_REQUIRED });
    },
    {
      submission: {
        action: async (f) => this.save(f().value()),
        onInvalid: () => this.alertFirstMissing(),
      },
    },
  );

  async onFileSelected(event: Event, key: RiderDocumentKey): Promise<void> {
    const file = firstPickedFile(event);
    const image = file?.type.startsWith(PERSONAL_DOCUMENT_PAGE.IMAGE_MIME_PREFIX) ? await readAsDataUrl(file) : '';
    this.documentForm[key]().value.set(image);
  }

  clear(key: RiderDocumentKey): void {
    this.documentForm[key]().value.set('');
  }

  /** Same behaviour as before: one alert naming the first missing document. */
  private alertFirstMissing(): void {
    const missing = PERSONAL_DOCUMENT_PAGE.FIELDS.find((field) => this.documentForm[field.key]().invalid());
    const message = missing ? this.documentForm[missing.key]().errors()[0]?.message : undefined;
    if (message) {
      void this.alerts.presentAlert(PERSONAL_DOCUMENT_PAGE.ALERT_TITLE, message, 'error');
    }
  }

  private async save(value: RiderDocuments): Promise<undefined> {
    try {
      await this.riders.saveDocuments(this.auth.userId() ?? '', value);
      await this.navigation.forward(APP_ROUTE_LINKS.ORDER);
    } catch (error) {
      await this.alerts.saveFailed(PERSONAL_DOCUMENT_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }
}
