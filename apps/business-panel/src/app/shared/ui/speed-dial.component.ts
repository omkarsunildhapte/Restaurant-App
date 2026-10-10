import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { IconComponent, IconName } from './icon.component';

export interface SpeedDialItem {
  label: string;
  icon: IconName;
  command: () => void;
  disabled?: boolean;
}

/**
 * Floating action button that expands into a row of round action buttons
 * (opening to the left of the trigger). Closes on action, outside click or Esc.
 */
@Component({
    selector: 'ui-speed-dial',
    imports: [IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: 'relative inline-flex items-center',
        '(document:mousedown)': 'onDocumentClick($event)',
        '(keydown.escape)': 'close(true)',
    },
    template: `
    @if (open()) {
      <ul class="absolute right-full top-1/2 z-20 mr-2 flex -translate-y-1/2 gap-2" role="menu">
        @for (item of model(); track item.label) {
          <li role="none" class="ui-speed-dial-item" [style.animation-delay.ms]="$index * 40">
            <button
              type="button"
              role="menuitem"
              class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-600 text-white shadow-md hover:bg-gray-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-60"
              [attr.aria-label]="item.label"
              [title]="item.label"
              [disabled]="item.disabled"
              (click)="run(item)"
            >
              <ui-icon [name]="item.icon" size="h-5 w-5" />
            </button>
          </li>
        }
      </ul>
    }
    <button
      type="button"
      class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-md transition-colors hover:bg-green-600 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:ring-offset-2"
      [attr.aria-label]="ariaLabel()"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      (click)="open.set(!open())"
    >
      <ui-icon name="plus" size="h-6 w-6" class="transition-transform duration-200" [class.rotate-45]="open()" />
    </button>
  `,
    styles: [
        `
      .ui-speed-dial-item { animation: ui-speed-dial-in 150ms ease-out both; }
      @keyframes ui-speed-dial-in { from { opacity: 0; transform: scale(0.6); } }
    `,
    ]
})
export class SpeedDialComponent {
  readonly model = input<SpeedDialItem[]>([]);
  readonly ariaLabel = input('Actions');

  protected readonly open = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected run(item: SpeedDialItem): void {
    this.open.set(false);
    item.command();
  }

  protected close(refocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (refocus) this.host.nativeElement.querySelector<HTMLElement>('button[aria-haspopup]')?.focus();
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }
}
