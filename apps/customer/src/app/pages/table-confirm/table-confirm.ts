import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonBackButton } from '@ionic/angular/ion-back-button';
import { IonButton } from '@ionic/angular/ion-button';
import { IonButtons } from '@ionic/angular/ion-buttons';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import { TableBooking } from '@appTypes/table.types';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TABLE_CONFIRM_PAGE } from '@constants/table-confirm.constants';
import { AuthService } from '@services/auth/auth.service';
import { TableService } from '@services/table/table.service';
import { Loading } from '@shared/loading/loading';

/** Confirmation of the customer's latest table booking. */
@Component({
  selector: 'app-table-confirm',
  imports: [RouterLink, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar, Loading],
  templateUrl: './table-confirm.html',
  styleUrl: './table-confirm.css',
})
export class TableConfirm {
  private readonly tableService = inject(TableService);
  private readonly auth = inject(AuthService);

  readonly copy = TABLE_CONFIRM_PAGE;
  readonly links = APP_ROUTE_LINKS;

  readonly bookings = resource<TableBooking[], string | undefined>({
    params: () => this.auth.currentUser()?.id,
    loader: ({ params }) => this.tableService.listBookings(params),
    defaultValue: [],
  });
  readonly booking = computed<TableBooking | null>(() => this.bookings.value()[0] ?? null);
}
