import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-rate-shop-model1',
  templateUrl: './rate-shop-model1.component.html',
  styleUrls: ['./rate-shop-model1.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RateShopModel1Component  implements OnInit {
  
  @Input() message:any='';
  constructor() { }

  ngOnInit() {}

}
