import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ToastSeverity = 'success' | 'error' | 'info';

export interface ToastMessage {
  severity: ToastSeverity;
  summary?: string;
  detail?: string;
  /** Auto-dismiss delay in ms (default 3000). Use 0 to keep until closed. */
  life?: number;
}

export interface Toast extends ToastMessage {
  id: number;
}

/** App-wide toasts. Rendered by <ui-toast-container> in AppComponent. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private nextId = 0;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  add(message: ToastMessage): number {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { ...message, id }]);
    const life = message.life ?? 3000;
    // No timers on the server: they would delay SSR and toasts are never shown there.
    if (life > 0 && this.isBrowser) setTimeout(() => this.dismiss(id), life);
    return id;
  }

  success(detail: string, summary = 'Success'): number {
    return this.add({ severity: 'success', summary, detail });
  }

  error(detail: string, summary = 'Error'): number {
    return this.add({ severity: 'error', summary, detail });
  }

  info(detail: string, summary = 'Info'): number {
    return this.add({ severity: 'info', summary, detail });
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
