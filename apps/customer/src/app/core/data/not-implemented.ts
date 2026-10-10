import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Observable, throwError } from 'rxjs';

/** Thrown by data-service stubs whose backing Supabase table is not wired yet. */
export class NotImplementedError extends Error {
  constructor(operation: string) {
    super(`Not connected yet: ${operation}`);
    this.name = 'NotImplementedError';
  }
}

export function notImplemented<T>(operation: string): Observable<T> {
  return throwError(() => new NotImplementedError(operation));
}

/** Shows the "Not connected yet" toast used by pages when a stubbed action is triggered. */
@Injectable({ providedIn: 'root' })
export class NotConnectedToast {
  constructor(private toastController: ToastController) {}

  async show(message = 'Not connected yet'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }
}
