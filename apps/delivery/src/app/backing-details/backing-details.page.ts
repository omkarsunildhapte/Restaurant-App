import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
    selector: 'app-backing-details',
    templateUrl: './backing-details.page.html',
    styleUrls: ['./backing-details.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonContent, IonHeader, IonTitle, IonToolbar],
})
export class BackingDetailsPage implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
