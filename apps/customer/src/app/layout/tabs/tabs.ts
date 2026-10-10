import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/ion-icon';
import { IonLabel } from '@ionic/angular/ion-label';
import { IonTabBar } from '@ionic/angular/ion-tab-bar';
import { IonTabButton } from '@ionic/angular/ion-tab-button';
import { IonTabs } from '@ionic/angular/ion-tabs';
import { filter, map } from 'rxjs';
import { NAV_ITEMS } from '@constants/navigation.constants';

const lastSegment = (url: string): string => url.split('?')[0].split('/').filter(Boolean).pop() ?? '';

/** The /main shell: bottom tab bar + the tab router outlet (inside IonTabs). */
@Component({
  selector: 'app-tabs',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class Tabs {
  private readonly router = inject(Router);

  readonly items = NAV_ITEMS.map((item) => ({ ...item, tab: lastSegment(item.path) }));

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** The tab to highlight: the one whose screens include the current URL's last segment. */
  readonly activeTab = computed(() => {
    const segment = lastSegment(this.url());
    return this.items.find((item) => item.matches.includes(segment))?.tab ?? null;
  });
}
