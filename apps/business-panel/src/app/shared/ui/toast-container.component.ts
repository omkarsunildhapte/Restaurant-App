import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent, IconName } from './icon.component';
import { ToastService, ToastSeverity } from './toast.service';

const STYLES: Record<ToastSeverity, { box: string; icon: IconName }> = {
  success: { box: 'border-green-500 bg-green-50 text-green-700', icon: 'check' },
  error: { box: 'border-red-500 bg-red-50 text-red-700', icon: 'warning' },
  info: { box: 'border-blue-500 bg-blue-50 text-blue-700', icon: 'info' },
};

/** Top-right toast stack. Place once, in the root component. */
@Component({
    selector: 'ui-toast-container',
    imports: [IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <div
      class="pointer-events-none fixed right-5 top-5 z-1200 flex w-100 max-w-[calc(100vw-2.5rem)] flex-col gap-3"
      aria-live="polite"
      role="status"
    >
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-md border-l-[6px] p-4 shadow-md"
          [class]="styles[toast.severity].box"
        >
          <ui-icon [name]="styles[toast.severity].icon" size="h-6 w-6" />
          <div class="min-w-0 flex-1">
            @if (toast.summary) {
              <p class="font-bold">{{ toast.summary }}</p>
            }
            @if (toast.detail) {
              <p class="mt-1 text-sm">{{ toast.detail }}</p>
            }
          </div>
          <button
            type="button"
            class="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-black/5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-current"
            aria-label="Dismiss"
            (click)="toasts.dismiss(toast.id)"
          >
            <ui-icon name="x-mark" size="h-4 w-4" />
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly styles = STYLES;
}
