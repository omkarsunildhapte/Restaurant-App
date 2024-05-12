import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-payment-model',
  templateUrl: './payment-model.component.html',
  styleUrls: ['./payment-model.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PaymentModelComponent  implements OnInit {
  
  @Input() message:any='';
  constructor() { }

  ngOnInit() {}

}
