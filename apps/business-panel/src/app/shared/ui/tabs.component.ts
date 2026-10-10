import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
} from '@angular/core';

let nextId = 0;

/**
 * Simple tabs. Usage:
 *   <ui-tabs [(activeIndex)]="index">
 *     <ui-tab-panel header="First">…</ui-tab-panel>
 *     <ui-tab-panel header="Second">…</ui-tab-panel>
 *   </ui-tabs>
 * All panels stay rendered; inactive ones are hidden.
 */
@Component({
  selector: 'ui-tabs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div role="tablist" class="flex border-b-2 border-gray-200" (keydown)="onKeydown($event)">
      @for (panel of panels(); track panel; let i = $index) {
        <button
          type="button"
          role="tab"
          [id]="tabId(i)"
          [attr.aria-selected]="i === activeIndex()"
          [attr.aria-controls]="panel.panelId"
          [tabindex]="i === activeIndex() ? 0 : -1"
          class="-mb-0.5 border-b-2 px-5 py-4 font-bold transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-amber"
          [class]="
            i === activeIndex()
              ? 'border-brand-saffron text-brand-rust'
              : 'border-transparent text-gray-500 hover:border-gray-400 hover:text-gray-700'
          "
          (click)="activeIndex.set(i)"
        >
          {{ panel.header() }}
        </button>
      }
    </div>
    <div class="py-5">
      <ng-content />
    </div>
  `,
})
export class TabsComponent {
  readonly activeIndex = model(0);
  readonly panels = contentChildren(forwardRef(() => TabPanelComponent));
  readonly groupId = `ui-tabs-${nextId++}`;

  tabId(index: number): string {
    return `${this.groupId}-tab-${index}`;
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.panels().length;
    if (!count) return;
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (this.activeIndex() + delta + count) % count;
    this.activeIndex.set(next);
    (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus();
  }
}

@Component({
  selector: 'ui-tab-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'tabpanel',
    '[id]': 'panelId',
    '[hidden]': '!active()',
    '[attr.aria-labelledby]': 'labelledBy()',
  },
  template: `<ng-content />`,
})
export class TabPanelComponent {
  readonly header = input('');
  private readonly tabs = inject(TabsComponent);
  private readonly index = computed(() => this.tabs.panels().indexOf(this));
  readonly panelId = `${this.tabs.groupId}-panel-${nextId++}`;
  protected readonly active = computed(() => this.index() === this.tabs.activeIndex());
  protected readonly labelledBy = computed(() => this.tabs.tabId(this.index()));
}
