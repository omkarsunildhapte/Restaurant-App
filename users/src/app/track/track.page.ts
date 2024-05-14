import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../servies/routing.service';

@Component({
  selector: 'app-track',
  templateUrl: './track.page.html',
  styleUrls: ['./track.page.scss'],
})
export class TrackPage implements OnInit {
showValue: boolean=false;

  constructor(
    public routing:RoutingService
  ){}
  ngOnInit() {
  }

}
