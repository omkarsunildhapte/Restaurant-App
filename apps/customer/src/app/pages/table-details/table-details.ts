import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, FormRoot, email, form, min, required } from '@angular/forms/signals';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonDatetime } from '@ionic/angular/ion-datetime';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonImg } from '@ionic/angular/ion-img';
import { IonInput } from '@ionic/angular/ion-input';
import { IonItem } from '@ionic/angular/ion-item';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonList } from '@ionic/angular/ion-list';
import { IonModal } from '@ionic/angular/ion-modal';
import { IonSegment } from '@ionic/angular/ion-segment';
import { IonSegmentButton } from '@ionic/angular/ion-segment-button';
import { IonTextarea } from '@ionic/angular/ion-textarea';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { DiningTable, TableBookingForm } from '@appTypes/table.types';
import { CURRENCY } from '@constants/app.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { REVIEW_PLACEHOLDERS } from '@constants/reviews.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TABLE_DETAILS_PAGE, TableDetailsSegment } from '@constants/table-details.constants';
import { VALIDATION } from '@constants/validation.constants';
import { AuthService } from '@services/auth/auth.service';
import { TableService } from '@services/table/table.service';
import { ToastService } from '@services/toast/toast.service';
import { QuantityStepper } from '@components/quantity-stepper/quantity-stepper';
import { ReviewCard } from '@components/review-card/review-card';
import { FieldErrors } from '@shared/field-errors/field-errors';
import { Loading } from '@shared/loading/loading';
import { timeSlots } from '@utils/time-slots/time-slots.util';

/** One table (`?id=`) with reviews and the booking form. */
@Component({
  selector: 'app-table-details',
  imports: [FormField, FormRoot, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonDatetime, IonHeader, IonIcon, IonImg, IonInput, IonItem, IonLabel, IonList, IonModal, IonSegment, IonSegmentButton, IonTextarea, IonTitle, IonToolbar, QuantityStepper, ReviewCard, FieldErrors, Loading],
  templateUrl: './table-details.html',
  styleUrl: './table-details.css',
})
export class TableDetails {
  private readonly tableService = inject(TableService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** From the `id` query parameter (withComponentInputBinding). */
  readonly id = input<string>('');

  readonly copy = TABLE_DETAILS_PAGE;
  readonly reviews = REVIEW_PLACEHOLDERS;
  readonly currency = CURRENCY.SYMBOL;
  readonly links = APP_ROUTE_LINKS;

  readonly segment = signal<TableDetailsSegment>(TABLE_DETAILS_PAGE.DEFAULT_SEGMENT);
  readonly datePickerOpen = signal(false);

  readonly table = resource<DiningTable | null, string | undefined>({
    params: () => this.id() || undefined,
    loader: ({ params }) => this.tableService.getTable(params),
    defaultValue: null,
  });

  private readonly model = signal<TableBookingForm>({ ...TABLE_DETAILS_PAGE.EMPTY_BOOKING });
  readonly bookingForm = form(
    this.model,
    (path) => {
      min(path.guests, VALIDATION.GUESTS_MIN, { message: VALIDATION_MESSAGES.GUESTS_MIN });
      required(path.date, { message: VALIDATION_MESSAGES.DATE_REQUIRED });
      required(path.time, { message: VALIDATION_MESSAGES.TIME_REQUIRED });
      required(path.firstName, { message: VALIDATION_MESSAGES.FIRST_NAME_REQUIRED });
      required(path.lastName, { message: VALIDATION_MESSAGES.LAST_NAME_REQUIRED });
      required(path.email, { message: VALIDATION_MESSAGES.EMAIL_REQUIRED });
      email(path.email, { message: VALIDATION_MESSAGES.EMAIL_INVALID });
    },
    {
      submission: {
        action: async (f) => {
          const userId = this.auth.currentUser()?.id;
          if (!userId) return undefined;
          try {
            await this.tableService.bookTable({ ...f().value(), tableId: this.id(), userId });
            await this.router.navigateByUrl(APP_ROUTE_LINKS.TABLE_CONFIRM);
          } catch {
            void this.toast.notConnected();
          }
          return undefined;
        },
      },
    },
  );

  readonly slots = computed(() => (this.model().date ? timeSlots(this.model().date) : []));

  changeGuests(delta: number): void {
    this.model.update((m) => ({ ...m, guests: Math.max(VALIDATION.GUESTS_MIN, m.guests + delta) }));
    this.bookingForm.guests().markAsTouched();
  }

  onDateChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | string[] | null }>).detail.value;
    const iso = Array.isArray(value) ? value[0] : value;
    if (!iso) return;
    this.model.update((m) => ({ ...m, date: iso.slice(0, TABLE_DETAILS_PAGE.DATE_KEY_LENGTH), time: '' }));
    this.datePickerOpen.set(false);
  }

  pickTime(slot: string): void {
    this.model.update((m) => ({ ...m, time: slot }));
  }

  onSegmentChange(event: Event): void {
    const value = (event as CustomEvent<{ value?: string | number }>).detail.value;
    if (value === 'booking' || value === 'review') this.segment.set(value);
  }
}
