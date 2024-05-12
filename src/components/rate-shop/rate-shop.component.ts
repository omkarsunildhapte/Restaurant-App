import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { RateShopModelComponent } from '../rate-shop-model/rate-shop-model.component';

@Component({
  selector: 'app-rate-shop',
  templateUrl: './rate-shop.component.html',
  styleUrls: ['./rate-shop.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RateShopComponent  implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  send() {
    this.showModal('New this ti start');
  }

  async showModal(message: string) {
    const modal = await this.modalController.create({
      component: RateShopModelComponent,
      componentProps: { msg: message },
      cssClass:'alert-model'
    });

    await modal.present();
  }

}
