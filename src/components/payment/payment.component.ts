import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { PaymentModelComponent } from '../payment-model/payment-model.component';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class PaymentComponent  implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  send() {
    this.showModal('New this ti start');
  }

  async showModal(message: string) {
    const modal = await this.modalController.create({
      component: PaymentModelComponent,
      componentProps: { msg: message },
      cssClass:'alert-model'
    });

    await modal.present();
  }


}
