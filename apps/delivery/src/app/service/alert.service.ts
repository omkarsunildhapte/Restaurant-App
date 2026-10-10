import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  
  constructor(private alertController: AlertController, private toastController: ToastController) { }

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

  /** Shown when a save hits a Phase 5 data stub (Firestore removed, Supabase not wired yet). */
  async notConnectedYet(message = 'Not connected yet') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  /** Shows an error's message (e.g. missing Supabase config) in the standard error alert. */
  async presentError(header: string, error: unknown, fallback = 'Something went wrong.') {
    const message = error instanceof Error && error.message ? error.message : fallback;
    await this.presentAlert(header, '', message, 'error');
  }
}
