import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-rate-shop-model',
  templateUrl: './rate-shop-model.component.html',
  styleUrls: ['./rate-shop-model.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RateShopModelComponent  implements OnInit {
  
  @Input() message:any='';
  constructor() { }

  ngOnInit() {}

}
