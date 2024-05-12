import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FeedbackModelComponent } from '../feedback-model/feedback-model.component';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class FeedbackComponent  implements OnInit {

  constructor(private modalController: ModalController) { }

  ngOnInit() {}
   
  send() {
    this.showModal('New this ti start');
  }

  async showModal(message: string) {
    const modal = await this.modalController.create({
      component: FeedbackModelComponent,
      componentProps: { msg: message },
      cssClass:'alert-model'
    });

    await modal.present();
  }
}
