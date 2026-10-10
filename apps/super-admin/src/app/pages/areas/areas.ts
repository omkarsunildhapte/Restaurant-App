import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LeadStore } from '@app/core/lead.store';
import {
  PUNE_AREAS,
  STAGE_LABEL,
  followUpClass,
  followUpState,
  shortDate,
  stageClass,
  type Lead,
} from '@app/core/crm';

interface AreaGroup {
  area: string;
  open: Lead[];
  paying: number;
  lost: number;
  due: number;
}

/**
 * Leads grouped by area, for planning a day of visits: pick an area, see every open
 * restaurant in it with its Maps link. Areas from GO-TO-MARKET.md come first, in visiting
 * order; any other area follows, busiest first.
 */
@Component({
  selector: 'app-areas',
  imports: [RouterLink],
  templateUrl: './areas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Areas implements OnInit {
  protected readonly store = inject(LeadStore);

  protected readonly stageLabel = STAGE_LABEL;
  protected readonly stageClass = stageClass;
  protected readonly shortDate = shortDate;

  protected readonly selected = signal<string | null>(null);

  public ngOnInit(): void {
    this.store.load();
  }

  protected readonly groups = computed<AreaGroup[]>(() => {
    const map = new Map<string, AreaGroup>();
    for (const lead of this.store.leads()) {
      const area = lead.area?.trim() || 'No area';
      let g = map.get(area);
      if (!g) map.set(area, (g = { area, open: [], paying: 0, lost: 0, due: 0 }));
      if (lead.stage === 'paying') g.paying++;
      else if (lead.stage === 'lost') g.lost++;
      else {
        g.open.push(lead);
        const s = followUpState(lead);
        if (s === 'overdue' || s === 'today') g.due++;
      }
    }
    const order = (a: string) => {
      const i = PUNE_AREAS.findIndex((p) => p.toLowerCase() === a.toLowerCase());
      return i === -1 ? PUNE_AREAS.length : i;
    };
    return [...map.values()].sort((a, b) => order(a.area) - order(b.area) || b.open.length - a.open.length);
  });

  protected readonly current = computed(() => {
    const groups = this.groups();
    const name = this.selected();
    return groups.find((g) => g.area === name) ?? groups.find((g) => g.open.length) ?? groups[0] ?? null;
  });

  protected followUp(lead: Lead): { label: string; cls: string } {
    const state = followUpState(lead);
    return {
      label: state === 'none' ? 'No date' : shortDate(lead.nextFollowUpOn),
      cls: followUpClass(state),
    };
  }

  /** The area on OpenStreetMap, for planning the route (the platform uses OSM, not Google Maps). */
  protected routeLink(group: AreaGroup): string {
    return 'https://www.openstreetmap.org/search?query=' + encodeURIComponent(group.area + ', Pune');
  }
}
