import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ConfirmService } from './confirm.service';
import { IconComponent } from './icon.component';
import { ModalComponent } from './modal.component';

/** Host for ConfirmService requests. Place once, in the root component. */
@Component({
    selector: 'ui-confirm-dialog',
    imports: [ModalComponent, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <ui-modal
      [visible]="!!request()"
      (visibleChange)="!$event && confirm.respond(false)"
      [header]="request()?.header ?? ''"
      width="28rem"
    >
      @if (request(); as r) {
        <div class="flex items-center gap-4">
          @if (r.icon) {
            <ui-icon [name]="r.icon" size="h-8 w-8" class="text-gray-500" />
          }
          <p class="text-base">{{ r.message }}</p>
        </div>
      }
      <div uiModalFooter class="flex justify-end gap-2 px-6 pb-6">
        @if (request(); as r) {
          <button type="button" class="btn btn-text" (click)="confirm.respond(false)">
            {{ r.rejectLabel }}
          </button>
          <button
            type="button"
            data-autofocus
            class="btn"
            [class.btn-danger-text]="r.acceptVariant === 'danger'"
            [class.btn-primary]="r.acceptVariant === 'primary'"
            (click)="confirm.respond(true)"
          >
            {{ r.acceptLabel }}
          </button>
        }
      </div>
    </ui-modal>
  `
})
export class ConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);
  protected readonly request = computed(() => this.confirm.pending());
}
