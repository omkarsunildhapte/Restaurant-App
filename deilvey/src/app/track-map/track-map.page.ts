import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-track-map',
  templateUrl: './track-map.page.html',
  styleUrls: ['./track-map.page.scss'],
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
