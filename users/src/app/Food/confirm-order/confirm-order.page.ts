import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../../servies/routing.service';

@Component({
  selector: 'app-confirm-order',
  templateUrl: './confirm-order.page.html',
  styleUrls: ['./confirm-order.page.scss'],
})
export class ConfirmOrderPage implements OnInit {
  constructor(
    public routing:RoutingService
  ){}
  ngOnInit() {
  }

}
