import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { RoutingService } from 'src/app/service/routing.service';
import { TableService } from 'src/app/service/table.service';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-table-confirm',
    templateUrl: './table-confirm.page.html',
    styleUrls: ['./table-confirm.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, LoadingComponent]
})
export class TableConfirmPage implements OnInit {
  readonly isLoading = signal<boolean>(true);
  readonly bookingValue = signal<any>(undefined);
  constructor(
    public routerLink: RoutingService,
    private tableService: TableService
  ) {
  }

  ngOnInit() {
    const uid = localStorage.getItem('uid');
    this.isLoading.set(false);
    if (uid) {
      this.isLoading.set(true);
      this.tableService.getTableBook(uid).subscribe((res: any) => {
        this.bookingValue.set(res[0]);
        this.isLoading.set(false);
      })
    }
  }

}
