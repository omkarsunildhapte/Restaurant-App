import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-payment-methods',
    templateUrl: './payment-methods.page.html',
    styleUrls: ['./payment-methods.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar]
})
export class PaymentMethodsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
