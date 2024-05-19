import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../../servies/routing.service';
import { GeolocationService } from 'src/app/servies/geolocation.service';
import { FirebaseService } from 'src/app/servies/firebase.service';

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
})
export class LocationPage implements OnInit {
  currentLocation: GeolocationPosition | null = null;
  errorMessage: string | null = null;
  userData: any;

  constructor(
    public routerLink:RoutingService,
    private geolocationService: GeolocationService,
    private userService: FirebaseService
  ) { }

  ngOnInit() {
    const uid = localStorage.getItem('uid'); 
    if (uid) {
    this.userService.getUserByUID(uid).subscribe(
      (data) => {
        this.userData= data
      }
    )
  }
  
  }
  getLocation(){
    this.geolocationService.getCurrentLocation().subscribe(
      (position: GeolocationPosition) => {
        this.currentLocation = position;
      },
      (error: GeolocationPositionError | string) => {
        if (typeof error === 'string') {
          this.errorMessage = error;
        } else {
          
        }
      }
    );
  }

}
    // this.routerLink.navigateUrl('/main',undefined);