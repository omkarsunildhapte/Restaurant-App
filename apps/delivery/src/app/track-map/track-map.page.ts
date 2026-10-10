import { Component, ElementRef, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
    selector: 'app-track-map',
    templateUrl: './track-map.page.html',
    styleUrls: ['./track-map.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonButton, IonCard, IonCardContent, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar],
})
export class TrackMapPage implements OnInit {
  @ViewChild('map', { static: true }) mapElementRef!: ElementRef;
  googleMaps: any;
  source: any = {};
  dest: any = {};
  map: any;
  directionsService: any;
  directionsDisplay: any;
  source_marker: any;
  destination_marker: any;
  trackSub!: Subscription;
  showValue: boolean=true;
  orderDetails: any;
  expaneded: boolean=false;
  location:string='49th St Los Angeles, California';
  isLoading:boolean = true;
  constructor() { }

  ngOnInit() {
  }

}
