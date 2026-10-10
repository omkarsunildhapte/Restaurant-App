import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
    selector: 'app-vehicle-details',
    templateUrl: './vehicle-details.page.html',
    styleUrls: ['./vehicle-details.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar],
})
export class VehicleDetailsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
