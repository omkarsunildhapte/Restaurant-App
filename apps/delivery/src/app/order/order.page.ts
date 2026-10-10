import { Component, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { OrdersDataService, RiderOrder } from '../core/data/orders.data.service';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
    selector: 'app-order',
    templateUrl: './order.page.html',
    styleUrls: ['./order.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonImg, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar],
})
export class OrderPage implements OnInit {
  segment: string = 'delivery';
  readonly orderList = signal<RiderOrder[]>([]);

  constructor(
    private ordersData: OrdersDataService,
  ) { }

  ngOnInit() {
    this.ordersData.getOrders().subscribe((res)=>{
      this.orderList.set(res)
    })
  }

}
