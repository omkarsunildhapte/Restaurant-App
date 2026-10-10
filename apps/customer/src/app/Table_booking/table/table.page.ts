import { IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { Component, ElementRef, OnInit, ViewChild, ChangeDetectionStrategy, afterNextRender, signal } from '@angular/core';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';
import Swiper from 'swiper';
import { LoadingComponent } from '../../loader/loader.component';
@Component({
    selector: 'app-table',
    templateUrl: './table.page.html',
    styleUrls: ['./table.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonCard, IonCardContent, IonContent, IonHeader, IonTitle, IonToolbar, LoadingComponent]
})
export class TablePage implements OnInit {
  @ViewChild('swiperContainer', { static: false }) swiperContainer?: ElementRef;
  readonly isLoader = signal<boolean>(true);
  readonly tables = signal<any[]>([]);
  constructor(
    public routerLink: RoutingService,
    private tableService: TableService
  ) {
    // Swiper touches window/DOM: browser only, after the first render (never during SSR).
    afterNextRender(() => {
      if (this.swiperContainer) {
        new Swiper(this.swiperContainer.nativeElement, {
          navigation: true,
          pagination: { clickable: true },
          scrollbar: { draggable: true }
        });
      }
    });
  }

  ngOnInit() {
    this.tableService.getTable().subscribe((res: any) => {
      this.isLoader.set(false);
      this.tables.set(res);
    })
  }
  getTable(value: any) {
    const selected = {
      id: value.id
    }
    this.routerLink.navigateUrl('/main/table-details', selected)
  }

}
