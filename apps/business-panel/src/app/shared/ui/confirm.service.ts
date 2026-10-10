import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  message: string;
  header?: string;
  icon?: 'info' | 'warning' | null;
  acceptLabel?: string;
  rejectLabel?: string;
  /** Styling of the accept button. */
  acceptVariant?: 'primary' | 'danger';
}

interface PendingConfirm extends Required<Omit<ConfirmOptions, 'icon'>> {
  icon: ConfirmOptions['icon'];
  resolve: (accepted: boolean) => void;
}

/**
 * App-wide confirmation dialog. `confirm()` resolves `true` when accepted and
 * `false` when rejected/dismissed. Rendered by <ui-confirm-dialog> in AppComponent.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _pending = signal<PendingConfirm | null>(null);
  readonly pending = this._pending.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    // A new request supersedes (rejects) any still-open one.
    this._pending()?.resolve(false);
    return new Promise<boolean>((resolve) => {
      this._pending.set({
        header: 'Confirmation',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        acceptVariant: 'primary',
        ...options,
        icon: options.icon === undefined ? 'info' : options.icon,
        resolve,
      });
    });
  }

  respond(accepted: boolean): void {
    const pending = this._pending();
    if (!pending) return;
    this._pending.set(null);
    pending.resolve(accepted);
  }
}
