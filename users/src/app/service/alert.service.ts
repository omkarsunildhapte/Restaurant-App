import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  constructor(private alertController: AlertController) { }

  async presentAlert(header: string, subHeader: string, message: string, type: 'success' | 'error' | 'warning') {
    let cssClass = '';
    switch (type) {
      case 'success':
        cssClass = 'alert-success';
        break;
      case 'error':
        cssClass = 'alert-error';
        break;
      case 'warning':
        cssClass = 'alert-warning';
        break;
    }

    const alert = await this.alertController.create({
      header: header,
      subHeader: subHeader,
      message: message,
      cssClass: cssClass,
      buttons: [
        {
          text: 'OK',
          role: 'confirm',
          cssClass: 'alert-button-ok'
        }
      ]
    });

    await alert.present();
  }
}
