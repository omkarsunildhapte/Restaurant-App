import {
  Component,
  ElementRef,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FoodService } from 'src/app/service/food.service';
import { GeolocationService } from 'src/app/service/geolocation.service';

@Component({
  selector: 'app-track',
  templateUrl: './track.page.html',
  styleUrls: ['./track.page.scss'],
})
export class TrackPage implements OnInit {
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
  orderDetails: any ={};
  expaneded: boolean=false;
  location:string='49th St Los Angeles, California'
  constructor(
    private renderer: Renderer2,
    private geolocationService: GeolocationService,
    private foodService: FoodService
  ) {}

  ngOnInit() {
    // this.trackSub = this.geolocationService.getLocation().subscribe({
    //   next: (data) => {
    //     console.log(data);
    //     this.source = data?.source;
    //     if (!this.dest?.lat) {
    //       this.dest = data?.destination;
    //       this.loadMap();
    //     } else {
    //       this.changeMarkerPosition(this.source);
    //     }
    //   },
    // });
  }

  ngAfterViewInit() {
    // this.loadMap();
    this.getOrder();
  }

  getOrder() {
    let uid = localStorage.getItem('uid');
    if (uid)
      this.foodService.getUserOrder(uid).subscribe((res: any) => {
        debugger;
        this.orderDetails = res;
      });
  }

  // map code
  async loadMap() {
    try {
      console.log('map');
      let googleMaps: any = await this.geolocationService.loadGoogleMaps();
      const mapEl = this.mapElementRef.nativeElement;
      this.map = new googleMaps.Map(mapEl, {
        center: { lat: this.source.lat, lng: this.source.lng },
        disableDefaultUI: true,
        zoom: 13,
      });
      this.directionsService = new googleMaps.DirectionsService();
      this.directionsDisplay = new googleMaps.DirectionsRenderer();
      this.directionsDisplay = new googleMaps.DirectionsRenderer();
      const sourceIconUrl = 'assets/imgs/car.png';
      const destinationIconUrl = 'assets/imgs/pin.png';

      const source_position = new googleMaps.LatLng(
        this.source.lat,
        this.source.lng
      );
      const destination_position = new googleMaps.LatLng(
        this.dest.lat,
        this.dest.lng
      );

      const source_icon = {
        url: sourceIconUrl,
        scaledSize: new googleMaps.Size(50, 50),
        origin: new googleMaps.Point(0, 0),
        anchor: new googleMaps.Point(0, 0),
      };
      const destination_icon = {
        url: destinationIconUrl,
        scaledSize: new googleMaps.Size(50, 50),
        origin: new googleMaps.Point(0, 0),
        anchor: new googleMaps.Point(0, 0),
      };
      this.source_marker = new googleMaps.Marker({
        map: this.map,
        position: source_position,
        animation: googleMaps.Animation.DROP,
        icon: source_icon,
      });

      this.destination_marker = new googleMaps.Marker({
        map: this.map,
        position: destination_position,
        animation: googleMaps.Animation.DROP,
        icon: destination_icon,
      });

      this.source_marker.setMap(this.map);
      this.destination_marker.setMap(this.map);

      this.directionsDisplay.setMap(this.map);
      this.directionsDisplay.setOptions({
        polylineOptions: {
          strokeWeight: 4,
          strokeOpacity: 1,
          strokeColor: 'black',
        },
        suppressMarkers: true,
      });

      await this.drawRoute();

      this.map.setCenter(source_position);
      this.renderer.addClass(mapEl, 'visible');
    } catch (e) {
      console.log(e);
    }
  }

  drawRoute() {
    this.directionsService.route(
      {
        origin: this.source,
        destination: this.dest,
        travelMode: 'DRIVING',
        provideRouteAlternatives: true,
      },
      (response: any, status: any) => {
        if (status === 'OK') {
          this.directionsDisplay.setDirections(response);
          console.log('response: ', response);
          const directionsData = response.routes[0].legs[0];
          console.log(directionsData);
          const duration = directionsData.duration.text;
          console.log(duration);
        } else {
          console.log(status);
        }
      }
    );
  }

  changeMarkerPosition(data: any) {
    const newPosition = { lat: data?.lat, lng: data?.lng };
    this.source_marker.setPosition(newPosition);
    this.drawRoute();
  }

  ngOnDestroy(): void {
    if (this.trackSub) this.trackSub.unsubscribe();
  }
}
