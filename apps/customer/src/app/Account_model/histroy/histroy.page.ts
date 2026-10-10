import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/angular';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-histroy',
    templateUrl: './histroy.page.html',
    styleUrls: ['./histroy.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSegment, IonSegmentButton, IonTitle, IonToolbar, FormsModule, LoadingComponent]
})
export class HistroyPage implements OnInit {
  segment: string='order';
  isLoader:boolean=false;
  constructor() { }

  ngOnInit() {
  }

}
