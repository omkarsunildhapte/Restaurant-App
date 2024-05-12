import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.scss'],
  standalone:true,
  imports:[CommonModule,IonicModule]
})
export class OrderHistoryComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
