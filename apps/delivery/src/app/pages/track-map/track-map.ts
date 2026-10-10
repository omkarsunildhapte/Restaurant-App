import { Component, computed, effect, inject, resource, signal } from '@angular/core';
import { FormField, FormRoot, form, pattern, required } from '@angular/forms/signals';
import { CurrencyPipe } from '@angular/common';
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
import { IonSelect } from '@ionic/angular/ion-select';
import { IonSelectOption } from '@ionic/angular/ion-select-option';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { FieldErrors } from '@components/field-errors/field-errors';
import { Loader } from '@components/loader/loader';
import { TrackingService } from '@services/tracking/tracking.service';
import { OrdersService } from '@services/orders/orders.service';
import { ShiftService } from '@services/shift/shift.service';
import { AlertService } from '@services/alert/alert.service';
import { LocationService } from '@services/location/location.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { MapPoint } from '@appTypes/order.types';
import { DeliverFormState, FailFormState, TrackPanel } from '@appTypes/tracking.types';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TRACK_MAP_PAGE } from '@constants/track-map.constants';
import { ORDER_PAGE } from '@constants/order.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { mapLink, telLink } from '@utils/device-link/device-link.util';

/**
 * The delivery in progress: pickup and drop with navigate/call links, the next step button
 * (reached restaurant → picked up → reached customer), and the hand-over: the customer's OTP and,
 * for cash on delivery, the cash taken. "Could not deliver" returns the order to the restaurant.
 * RenderMode.Client: everything here needs the rider's session.
 */
@Component({
  selector: 'app-track-map',
  imports: [CurrencyPipe, FormRoot, FormField, FieldErrors, Loader, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonSelect, IonSelectOption, IonTitle, IonToolbar],
  templateUrl: './track-map.html',
  styleUrl: './track-map.css',
})
export class TrackMap {
  private readonly tracking = inject(TrackingService);
  private readonly orders = inject(OrdersService);
  private readonly shift = inject(ShiftService);
  private readonly alerts = inject(AlertService);
  private readonly location = inject(LocationService);
  private readonly navigation = inject(NavigationService);

  readonly page = TRACK_MAP_PAGE;
  readonly statusLabels = ORDER_PAGE.STATUS_LABELS;
  readonly backLink = APP_ROUTE_LINKS.ORDER;
  readonly showDetails = signal(true);
  readonly panel = signal<TrackPanel>('details');
  readonly stepping = signal(false);

  readonly delivery = resource({
    params: () => ({ version: this.shift.jobsVersion() }),
    loader: () => this.tracking.getActiveDelivery(),
    defaultValue: null,
  });

  /** Never throws: an errored load shows the empty state (Rule 8). */
  readonly current = computed(() => (this.delivery.hasValue() ? this.delivery.value() : null));
  readonly initial = computed(() => this.current()?.customerName?.charAt(0).toUpperCase() ?? '');
  readonly nextStep = computed(() => {
    const job = this.current();
    return job ? (TRACK_MAP_PAGE.NEXT_STEP[job.status] ?? null) : null;
  });
  readonly canDeliver = computed(() => !!this.current() && TRACK_MAP_PAGE.CAN_DELIVER.includes(this.current()!.status));
  readonly canFail = computed(() => !!this.current() && TRACK_MAP_PAGE.CAN_FAIL.includes(this.current()!.status));
  readonly links = computed(() => {
    const job = this.current();
    return { pickup: mapLink(job?.pickup ?? null), drop: mapLink(job?.drop ?? null), customer: telLink(job?.customerPhone ?? null), outlet: telLink(job?.outletPhone ?? null) };
  });

  private readonly deliverModel = signal<DeliverFormState>({ ...TRACK_MAP_PAGE.EMPTY_DELIVER_FORM });
  readonly deliverForm = form(
    this.deliverModel,
    (path) => {
      required(path.otp, { message: VALIDATION_MESSAGES.OTP_REQUIRED });
      pattern(path.otp, TRACK_MAP_PAGE.OTP_PATTERN, { message: VALIDATION_MESSAGES.OTP_PATTERN });
      required(path.cash, { message: VALIDATION_MESSAGES.CASH_REQUIRED, when: () => (this.current()?.codAmount ?? 0) > 0 });
      pattern(path.cash, TRACK_MAP_PAGE.CASH_PATTERN, { message: VALIDATION_MESSAGES.CASH_PATTERN });
    },
    { submission: { action: async (f) => this.deliver(f().value()) } },
  );

  private readonly failModel = signal<FailFormState>({ ...TRACK_MAP_PAGE.EMPTY_FAIL_FORM });
  readonly failForm = form(this.failModel, (path) => required(path.reason, { message: VALIDATION_MESSAGES.FAIL_REASON_REQUIRED }), { submission: { action: async (f) => this.fail(f().value()) } });

  constructor() {
    // Positions are tied to this job and sent more often while it is open.
    effect(() => this.shift.setActiveJob(this.current()?.id ?? null));
  }

  toggleDetails(): void {
    this.showDetails.update((shown) => !shown);
  }

  /** Opens the hand-over form with the cash due filled in. */
  openDeliver(): void {
    const cod = this.current()?.codAmount ?? 0;
    this.deliverModel.set({ otp: '', cash: cod > 0 ? String(cod) : '' });
    this.panel.set('deliver');
  }

  openFail(): void {
    this.failModel.set({ ...TRACK_MAP_PAGE.EMPTY_FAIL_FORM });
    this.panel.set('fail');
  }

  closePanel(): void {
    this.panel.set('details');
  }

  async advance(): Promise<void> {
    const job = this.current();
    const next = this.nextStep();
    if (!job || !next) {
      return;
    }
    this.stepping.set(true);
    try {
      await this.orders.advance(job.id, next.step, await this.position());
      this.refresh();
    } catch (error) {
      await this.alerts.presentError(TRACK_MAP_PAGE.ALERT_TITLE, error);
    } finally {
      this.stepping.set(false);
    }
  }

  private async deliver(value: DeliverFormState): Promise<undefined> {
    const job = this.current();
    if (!job) {
      return undefined;
    }
    try {
      const codCollected = job.codAmount > 0 ? Number(value.cash) : null;
      await this.orders.complete(job.id, { otp: value.otp, photoUrl: null, codCollected, position: await this.position() });
      await this.finish(TRACK_MAP_PAGE.DELIVERED_MESSAGE);
    } catch (error) {
      await this.alerts.presentError(TRACK_MAP_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }

  private async fail(value: FailFormState): Promise<undefined> {
    const job = this.current();
    if (!job) {
      return undefined;
    }
    try {
      await this.orders.fail(job.id, { reason: value.reason, photoUrl: null, position: await this.position() });
      await this.finish(TRACK_MAP_PAGE.FAILED_MESSAGE);
    } catch (error) {
      await this.alerts.presentError(TRACK_MAP_PAGE.ALERT_TITLE, error);
    }
    return undefined;
  }

  private async finish(message: string): Promise<void> {
    this.panel.set('details');
    this.refresh();
    await this.alerts.presentAlert(TRACK_MAP_PAGE.ALERT_TITLE, message, 'success');
    await this.navigation.root(APP_ROUTE_LINKS.ORDER);
  }

  private refresh(): void {
    this.shift.jobsChanged();
  }

  /** Where the rider is, for the step's record; a step never waits on or fails for location. */
  private async position(): Promise<MapPoint | null> {
    try {
      const { lat, lng } = await this.location.getCurrentPosition();
      return { lat, lng };
    } catch {
      return null;
    }
  }
}
