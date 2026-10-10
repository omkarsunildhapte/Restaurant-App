import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  PLATFORM_ID,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { IconComponent } from './icon.component';

let nextId = 0;

/**
 * Modal dialog: overlay + centred panel.
 * - closes on Esc and on backdrop click (when `dismissable`)
 * - focuses the first form field (or first focusable element) when opened
 * - restores focus to the previously focused element when closed
 *
 * Usage: <ui-modal [(visible)]="visible" header="Title" width="40rem">…</ui-modal>
 * Optional footer: put content with the `uiModalFooter` attribute inside.
 */
@Component({
    selector: 'ui-modal',
    imports: [IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '(document:keydown.escape)': 'onEscape()' },
    template: `
    @if (visible()) {
      <div
        class="ui-modal-backdrop fixed inset-0 z-1100 flex items-center justify-center bg-black/40 p-4"
        (mousedown)="onBackdrop($event)"
      >
        <div
          #panel
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          [attr.aria-labelledby]="titleId"
          class="ui-modal-panel flex max-h-[90vh] w-full flex-col rounded-md bg-white text-gray-700 shadow-xl"
          [style.max-width]="width()"
        >
          <div class="flex items-center justify-between p-6 pb-2">
            <h2 [id]="titleId" class="text-xl font-bold text-gray-800">{{ header() }}</h2>
            @if (closable()) {
              <button
                type="button"
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-amber"
                aria-label="Close"
                (click)="close()"
              >
                <ui-icon name="x-mark" size="h-5 w-5" />
              </button>
            }
          </div>
          <div class="overflow-y-auto px-6 pb-6 pt-2">
            <ng-content />
          </div>
          <ng-content select="[uiModalFooter]" />
        </div>
      </div>
    }
  `,
    styles: [
        `
      .ui-modal-backdrop { animation: ui-modal-fade 150ms ease-out; }
      .ui-modal-panel { animation: ui-modal-zoom 150ms ease-out; }
      @keyframes ui-modal-fade { from { opacity: 0; } }
      @keyframes ui-modal-zoom { from { opacity: 0; transform: scale(0.95); } }
    `,
    ]
})
export class ModalComponent {
  readonly visible = model(false);
  readonly header = input('');
  readonly width = input('40rem');
  readonly closable = input(true);
  /** Close when clicking the backdrop or pressing Esc. */
  readonly dismissable = input(true);
  /** Emitted whenever the modal is closed by the user (X, Esc, backdrop). */
  readonly hide = output<void>();

  protected readonly titleId = `ui-modal-title-${nextId++}`;
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly injector = inject(Injector);
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const panel = this.panel()?.nativeElement;
      if (!this.isBrowser) return;
      if (panel) {
        this.previouslyFocused = document.activeElement as HTMLElement | null;
        // Wait for projected content to render before focusing (browser only).
        afterNextRender(() => this.focusFirst(panel), { injector: this.injector });
      } else if (this.previouslyFocused) {
        const el = this.previouslyFocused;
        this.previouslyFocused = null;
        if (document.contains(el)) el.focus();
      }
    });
  }

  close(): void {
    if (!this.visible()) return;
    this.visible.set(false);
    this.hide.emit();
  }

  protected onEscape(): void {
    if (this.visible() && this.dismissable() && this.isTopmost()) this.close();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (this.dismissable() && event.target === event.currentTarget) this.close();
  }

  /** Only the most recently opened modal reacts to Esc. */
  private isTopmost(): boolean {
    const panel = this.panel()?.nativeElement;
    if (!panel || !this.isBrowser) return true;
    const all = document.querySelectorAll('.ui-modal-panel');
    return all[all.length - 1] === panel;
  }

  private focusFirst(panel: HTMLElement): void {
    const field = panel.querySelector<HTMLElement>(
      'input:not([type=hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [data-autofocus]',
    );
    const fallback = panel.querySelector<HTMLElement>(
      'button:not([disabled]):not([aria-label="Close"]), [href], [tabindex]:not([tabindex="-1"])',
    );
    (field ?? fallback ?? panel).focus();
  }
}
