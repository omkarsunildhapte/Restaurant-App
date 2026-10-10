import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { TabPanelComponent, TabsComponent } from '../../../shared/ui/tabs.component';
import { WorkspaceStore } from '../../data/workspace.store';
import { AddonGroupsTab } from './addon-groups-tab';
import { CategoriesTab } from './categories-tab';
import { CombosTab } from './combos-tab';
import { ItemsTab } from './items-tab';
import { MenuStore } from './menu.store';

/** Menu for the whole business: items, categories, add-ons and combos. */
@Component({
  selector: 'bp-menu-page',
  imports: [TabsComponent, TabPanelComponent, ItemsTab, CategoriesTab, AddonGroupsTab, CombosTab],
  providers: [MenuStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Menu</h1>
        <p class="mt-1 text-sm text-gray-500">
          One menu for every outlet.
          @if (!ws.canEditMenu()) {
            You can view it; an owner or manager can change it.
          }
        </p>
      </div>
      <button type="button" class="btn btn-text px-3 py-2 text-sm" (click)="menu.load()" [disabled]="menu.loading()">
        {{ menu.loading() ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    @if (menu.error()) {
      <div class="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ menu.error() }}</div>
    }

    <div class="rounded-md bg-white px-4 shadow-xs">
      <ui-tabs [(activeIndex)]="tab">
        <ui-tab-panel header="Items"><bp-items-tab /></ui-tab-panel>
        <ui-tab-panel header="Categories"><bp-categories-tab /></ui-tab-panel>
        <ui-tab-panel header="Add-ons"><bp-addon-groups-tab /></ui-tab-panel>
        <ui-tab-panel header="Combos"><bp-combos-tab /></ui-tab-panel>
      </ui-tabs>
    </div>
  `,
})
export class MenuPage implements OnInit {
  protected readonly menu = inject(MenuStore);
  protected readonly ws = inject(WorkspaceStore);
  protected readonly tab = signal(0);

  public ngOnInit(): void {
    void this.menu.load();
  }
}
