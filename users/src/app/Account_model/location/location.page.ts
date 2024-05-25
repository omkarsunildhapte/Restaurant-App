import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { GeolocationService } from 'src/app/service/geolocation.service';
import { RoutingService } from 'src/app/service/routing.service';
import { UserService } from 'src/app/service/user.service';

@Component({
  selector: 'app-location',
  templateUrl: './location.page.html',
  styleUrls: ['./location.page.scss'],
})
export class LocationPage implements OnInit {
  currentLocation: GeolocationPosition | null = null;
  errorMessage: string | null = null;
  userData: any;
  @ViewChild('search') public searchElementRef!: ElementRef;
  @ViewChild('map') public mapElementRef!: ElementRef;
  public entries = [];
  constructor(
    public routerLink: RoutingService,
    private geolocationService: GeolocationService,
    private userService: UserService,
    private ngZone: NgZone
  ) {
  }

  ngOnInit() {
    const uid = localStorage.getItem('uid');
    if (uid) {
      this.userService.getUserByUID(uid).subscribe(
        (data) => {
          this.userData = data
        }
      )
    }

  }
  getLocation() {
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