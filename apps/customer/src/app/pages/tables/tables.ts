import { Component, ElementRef, afterRenderEffect, inject, resource, viewChildren } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonContent } from '@ionic/angular/ion-content';
import { IonHeader } from '@ionic/angular/ion-header';
import { IonTitle } from '@ionic/angular/ion-title';
import { IonToolbar } from '@ionic/angular/ion-toolbar';
import Swiper from 'swiper';
import { DiningTable } from '@appTypes/table.types';
import { CURRENCY } from '@constants/app.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TABLES_PAGE } from '@constants/tables.constants';
import { TableService } from '@services/table/table.service';
import { Loading } from '@shared/loading/loading';

/** Table Booking tab: the bookable tables, each with an image carousel. */
@Component({
  selector: 'app-tables',
  imports: [RouterLink, IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar, Loading],
  templateUrl: './tables.html',
  styleUrl: './tables.css',
})
export class Tables {
  private readonly tableService = inject(TableService);
  private readonly carousels = viewChildren<ElementRef<HTMLElement>>('carousel');
  private readonly started = new WeakSet<HTMLElement>();

  readonly copy = TABLES_PAGE;
  readonly currency = CURRENCY.SYMBOL;
  readonly detailsLink = APP_ROUTE_LINKS.TABLE_DETAILS;

  readonly tables = resource<DiningTable[], unknown>({ loader: () => this.tableService.listTables(), defaultValue: [] });

  constructor() {
    // Swiper touches the DOM: browser only, after render (never during SSR); once per carousel.
    afterRenderEffect(() => {
      for (const { nativeElement } of this.carousels()) {
        if (this.started.has(nativeElement)) continue;
        this.started.add(nativeElement);
        new Swiper(nativeElement);
      }
    });
  }
}
