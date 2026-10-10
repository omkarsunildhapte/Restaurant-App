import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { MessagePayload, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { environment } from 'src/environments/environment';

/**
 * Web push via Firebase Cloud Messaging (modular SDK). This supersedes the old
 * AngularFire compat messaging import, which was imported but never used, so nothing
 * calls this yet (same behaviour as before). Firebase is used ONLY for FCM.
 *
 * Native Android/iOS push should move to @capacitor/push-notifications.
 */
@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly platformId = inject(PLATFORM_ID);

  private app(): FirebaseApp {
    return getApps().length ? getApp() : initializeApp(environment.firebase);
  }

  /** Asks for notification permission and returns the FCM registration token (or null). */
  async requestToken(vapidKey?: string): Promise<string | null> {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (!(await isSupported())) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    return getToken(getMessaging(this.app()), vapidKey ? { vapidKey } : undefined);
  }

  /** Subscribes to foreground messages. Returns an unsubscribe function. */
  async onForegroundMessage(handler: (payload: MessagePayload) => void): Promise<() => void> {
    if (!isPlatformBrowser(this.platformId)) return () => undefined;
    if (!(await isSupported())) return () => undefined;
    return onMessage(getMessaging(this.app()), handler);
  }
}
