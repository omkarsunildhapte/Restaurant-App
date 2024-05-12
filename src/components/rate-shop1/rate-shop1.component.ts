import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { RateShopModel1Component } from '../rate-shop-model1/rate-shop-model1.component';

@Component({
  selector: 'app-rate-shop1',
  templateUrl: './rate-shop1.component.html',
  styleUrls: ['./rate-shop1.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RateShop1Component  implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  send() {
    this.showModal('New this ti start');
  }

  async showModal(message: string) {
    const modal = await this.modalController.create({
      component: RateShopModel1Component,
      componentProps: { msg: message },
      cssClass:'alert-model'
    });

    await modal.present();
  }
}
