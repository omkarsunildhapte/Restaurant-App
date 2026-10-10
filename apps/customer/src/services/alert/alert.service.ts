import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/alert-controller';
import { AlertKind } from '@appTypes/common.types';
import { IONIC_UI } from '@constants/app.constants';

/** Ionic alerts with the app's success / error / warning styling. */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertController = inject(AlertController);

  async present(header: string, message: string, kind: AlertKind): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: IONIC_UI.ALERT_CLASS[kind],
      buttons: [{ text: IONIC_UI.ALERT_OK_TEXT, role: IONIC_UI.ALERT_OK_ROLE, cssClass: IONIC_UI.ALERT_OK_CLASS }],
    });
    await alert.present();
  }
}
