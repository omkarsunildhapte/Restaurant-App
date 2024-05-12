import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { AlertMessageComponent } from '../alert-message/alert-message.component';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() { }

  send() {
    this.showModal('New this ti start');
  }

  async showModal(message: string) {
    const modal = await this.modalController.create({
      component: AlertMessageComponent,
      componentProps: { msg: message },
      cssClass:'alert-model'
    });

    await modal.present();
  }
   

}
