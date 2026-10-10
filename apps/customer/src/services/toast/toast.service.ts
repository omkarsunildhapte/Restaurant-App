import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/toast-controller';
import { IONIC_UI, UI_TIMING } from '@constants/app.constants';
import { NOT_CONNECTED } from '@constants/messages.constants';

/** Short toasts, e.g. "Not connected yet" when a stubbed action is used. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastController = inject(ToastController);

  async show(message: string): Promise<void> {
    const toast = await this.toastController.create({ message, duration: UI_TIMING.TOAST_DURATION_MS, position: IONIC_UI.TOAST_POSITION, color: IONIC_UI.TOAST_COLOR });
    await toast.present();
  }

  notConnected(): Promise<void> {
    return this.show(NOT_CONNECTED.TOAST);
  }
}
