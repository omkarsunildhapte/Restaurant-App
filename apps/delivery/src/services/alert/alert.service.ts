import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular/alert-controller';
import { ToastController } from '@ionic/angular/toast-controller';
import { AlertKind } from '@appTypes/alert.types';
import { ALERT } from '@constants/alert.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { errorMessage, isNotImplemented } from '@utils/errors/errors.util';

/** Ionic alerts and toasts used across the app. */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  async presentAlert(header: string, message: string, kind: AlertKind): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      cssClass: ALERT.CSS_CLASS[kind],
      buttons: [{ text: ALERT.OK_TEXT, role: ALERT.OK_ROLE, cssClass: ALERT.OK_CSS_CLASS }],
    });
    await alert.present();
  }

  /** Shown when a save hits a Phase 5 data stub (Firestore removed, Supabase not wired yet). */
  async notConnectedYet(): Promise<void> {
    const toast = await this.toastController.create({
      message: ERROR_MESSAGES.NOT_CONNECTED,
      duration: ALERT.TOAST_DURATION_MS,
      position: ALERT.TOAST_POSITION,
      color: ALERT.TOAST_COLOR,
    });
    await toast.present();
  }

  /** Shows an error's message (e.g. missing Supabase config) in the standard error alert. */
  async presentError(header: string, error: unknown, fallback: string = ERROR_MESSAGES.GENERIC): Promise<void> {
    await this.presentAlert(header, errorMessage(error, fallback), 'error');
  }

  /** A failed save: the stub toast for NotImplementedError, the error alert for anything else. */
  async saveFailed(header: string, error: unknown): Promise<void> {
    if (isNotImplemented(error)) {
      await this.notConnectedYet();
    } else {
      await this.presentError(header, error);
    }
  }
}
