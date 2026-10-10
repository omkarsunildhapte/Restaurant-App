import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { MessagePayload, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { environment } from '@environments/environment';
import { PUSH } from '@constants/push.constants';

/**
 * Web push via Firebase Cloud Messaging (modular SDK) — Firebase is used ONLY for FCM. Nothing calls
 * this yet (the old compat messaging import was unused). Native push should move to
 * @capacitor/push-notifications.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Asks for notification permission and returns the FCM registration token (or null). */
  async requestToken(vapidKey?: string): Promise<string | null> {
    if (!this.isBrowser || !(await isSupported())) return null;
    const permission = await Notification.requestPermission();
    if (permission !== PUSH.PERMISSION_GRANTED) return null;
    return getToken(getMessaging(this.app()), vapidKey ? { vapidKey } : undefined);
  }

  /** Subscribes to foreground messages. Returns an unsubscribe function. */
  async onForegroundMessage(handler: (payload: MessagePayload) => void): Promise<() => void> {
    if (!this.isBrowser || !(await isSupported())) return () => undefined;
    return onMessage(getMessaging(this.app()), handler);
  }

  private app(): FirebaseApp {
    return getApps().length ? getApp() : initializeApp(environment.firebase);
  }
}
