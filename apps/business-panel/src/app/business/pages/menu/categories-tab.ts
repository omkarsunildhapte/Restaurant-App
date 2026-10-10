import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ConfirmService } from '../../../shared/ui/confirm.service';
import { ToastService } from '../../../shared/ui/toast.service';
import { errorText, type ItemKind } from '../../data/db';
import { MenuService, type Category } from '../../data/menu.service';
import { WorkspaceStore } from '../../data/workspace.store';
import { MenuStore } from './menu.store';

@Component({
  selector: 'bp-categories-tab',
  imports: [FormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex items-center justify-between gap-2">
      <p class="text-sm text-gray-500">Categories group the menu. Their order here is the order customers and staff see.</p>
      @if (ws.canEditMenu()) {
        <button type="button" class="btn btn-primary px-4 py-2 text-sm" (click)="open(null)">Add category</button>
      }
    </div>

    <ul class="divide-y divide-gray-100 rounded-md border border-gray-200">
      @for (c of menu.categories(); track c.id; let i = $index; let last = $last) {
        <li class="flex flex-wrap items-center gap-3 px-3 py-3">
          @if (ws.canEditMenu()) {
            <span class="flex flex-col">
              <button type="button" class="px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" [disabled]="i === 0 || busy()" (click)="move(i, -1)" [attr.aria-label]="'Move ' + c.name + ' up'">▲</button>
              <button type="button" class="px-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" [disabled]="last || busy()" (click)="move(i, 1)" [attr.aria-label]="'Move ' + c.name + ' down'">▼</button>
            </span>
          }
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900">{{ c.name }}</p>
            <p class="text-xs text-gray-500">
              {{ c.kind === 'beverage' ? 'Drinks' : 'Food' }} · {{ menu.itemCountByCategory().get(c.id) ?? 0 }} items
              @if (!c.is_active) { · <span class="text-amber-700">hidden</span> }
            </p>
          </div>
          @if (ws.canEditMenu()) {
            <button type="button" class="btn btn-text px-3 py-2 text-sm" (click)="open(c)">Edit</button>
            <button type="button" class="btn btn-danger-text px-3 py-2 text-sm" (click)="remove(c)">Delete</button>
          }
        </li>
      } @empty {
        <li class="p-6 text-center text-sm text-gray-500">{{ menu.loading() ? 'Loading…' : 'No categories yet.' }}</li>
      }
    </ul>

    <ui-modal [(visible)]="editing" [header]="editId() ? 'Edit category' : 'Add category'" width="28rem">
      <form id="category-form" class="grid gap-4" (ngSubmit)="save()">
        <label class="block text-sm font-medium text-gray-700">
          Name
          <input class="form-input mt-1 py-2" name="name" required [(ngModel)]="name" placeholder="Starters" />
        </label>
        <fieldset>
          <legend class="text-sm font-medium text-gray-700">Holds</legend>
          <div class="mt-1 flex gap-5 text-sm">
            <label class="flex items-center gap-2"><input type="radio" name="kind" value="food" [(ngModel)]="kind" /> Food</label>
            <label class="flex items-center gap-2"><input type="radio" name="kind" value="beverage" [(ngModel)]="kind" /> Drinks</label>
          </div>
        </fieldset>
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" class="h-4 w-4" name="active" [(ngModel)]="active" /> Show on the menu
        </label>
        @if (formError()) {
          <p class="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">{{ formError() }}</p>
        }
      </form>
      <div uiModalFooter class="flex flex-wrap items-center justify-end gap-3 rounded-b-md border-t border-gray-100 bg-gray-50 px-6 py-4">
        <button type="button" class="btn border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-300" (click)="editing.set(false)">Cancel</button>
        <button type="submit" form="category-form" class="btn btn-primary px-4 py-2 text-sm" [disabled]="busy() || !name().trim()">
          {{ busy() ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </ui-modal>
  `,
})
export class CategoriesTab {
  protected readonly menu = inject(MenuStore);
  protected readonly ws = inject(WorkspaceStore);
  private readonly api = inject(MenuService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly editing = signal(false);
  protected readonly editId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly kind = signal<ItemKind>('food');
  protected readonly active = signal(true);
  protected readonly busy = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected open(c: Category | null): void {
    this.editId.set(c?.id ?? null);
    this.name.set(c?.name ?? '');
    this.kind.set(c?.kind ?? 'food');
    this.active.set(c?.is_active ?? true);
    this.formError.set(null);
    this.editing.set(true);
  }

  protected async save(): Promise<void> {
    const tenant = this.ws.tenantId();
    if (!tenant || !this.name().trim()) return;
    this.busy.set(true);
    this.formError.set(null);
    try {
      await this.api.saveCategory(tenant, this.editId(), { name: this.name().trim(), kind: this.kind(), is_active: this.active() });
      this.editing.set(false);
      await this.menu.load();
    } catch (e) {
      this.formError.set(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async move(index: number, step: -1 | 1): Promise<void> {
    this.busy.set(true);
    try {
      await this.api.moveCategory(this.menu.categories(), index, step);
      await this.menu.load();
    } catch (e) {
      this.toast.error(errorText(e));
    } finally {
      this.busy.set(false);
    }
  }

  protected async remove(c: Category): Promise<void> {
    const count = this.menu.itemCountByCategory().get(c.id) ?? 0;
    if (count) {
      this.toast.info(`"${c.name}" still has ${count} item${count === 1 ? '' : 's'}. Move or delete them first.`, 'Category not empty');
      return;
    }
    const ok = await this.confirm.confirm({
      header: 'Delete category',
      message: `Delete "${c.name}"?`,
      icon: 'warning',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptVariant: 'danger',
    });
    if (!ok) return;
    try {
      await this.api.deleteCategory(c.id);
      await this.menu.load();
    } catch (e) {
      this.toast.error(errorText(e));
    }
  }
}
