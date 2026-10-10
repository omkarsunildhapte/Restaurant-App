import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DragDropModule, type CdkDragDrop } from '@angular/cdk/drag-drop';
import { LeadStore } from '@app/core/lead.store';
import { TeamStore } from '@app/core/team.store';
import {
  LOST_REASONS,
  RESTAURANT_TYPE_LABEL,
  SOURCES,
  SOURCE_LABEL,
  STAGES,
  STAGE_LABEL,
  followUpClass,
  followUpState,
  shortDate,
  stageClass,
  type Lead,
  type Stage,
} from '@app/core/crm';

const VIEW_KEY = 'rp-console.leads-view';

function readView(): 'board' | 'list' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board';
  } catch {
    return 'board';
  }
}

@Component({
  selector: 'app-leads',
  imports: [FormsModule, DragDropModule, RouterLink],
  templateUrl: './leads.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Leads implements OnInit {
  protected readonly store = inject(LeadStore);
  protected readonly team = inject(TeamStore);
  private readonly router = inject(Router);

  protected readonly stages = STAGES;
  protected readonly sources = SOURCES;
  protected readonly lostReasons = LOST_REASONS;
  protected readonly stageLabel = STAGE_LABEL;
  protected readonly sourceLabel = SOURCE_LABEL;
  protected readonly typeLabel = RESTAURANT_TYPE_LABEL;
  protected readonly stageClass = stageClass;
  protected readonly shortDate = shortDate;

  protected readonly view = signal<'board' | 'list'>(readView());
  protected readonly search = signal('');
  protected readonly areaFilter = signal('');
  protected readonly sourceFilter = signal('');
  protected readonly ownerFilter = signal('');
  protected readonly stageFilter = signal('');

  /** A card dropped on "Lost" waits here until a reason is given. */
  protected readonly losing = signal<Lead | null>(null);
  protected readonly lostReason = signal('');

  public ngOnInit(): void {
    this.store.load();
    this.team.loadUsers();
  }

  protected readonly areaOptions = computed(() =>
    [...new Set(this.store.leads().map((l) => l.area).filter((a): a is string => !!a))].sort(),
  );

  protected readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const area = this.areaFilter();
    const source = this.sourceFilter();
    const owner = this.ownerFilter();
    return this.store.leads().filter((lead) => {
      if (area && lead.area !== area) return false;
      if (source && lead.source !== source) return false;
      if (owner === '__none__' ? lead.assignedTo : owner && lead.assignedTo !== owner) return false;
      if (!q) return true;
      return [lead.restaurantName, lead.ownerName, lead.phone, lead.area, lead.notes].some((v) =>
        (v ?? '').toLowerCase().includes(q),
      );
    });
  });

  protected readonly columns = computed(() => {
    const groups = {} as Record<Stage, Lead[]>;
    for (const stage of STAGES) groups[stage] = [];
    for (const lead of this.filtered()) groups[lead.stage].push(lead);
    return groups;
  });

  protected readonly rows = computed(() => {
    const stage = this.stageFilter();
    const rows = stage ? this.filtered().filter((l) => l.stage === stage) : this.filtered();
    // Most urgent first: overdue, then today, then by date; unscheduled and closed last.
    return [...rows].sort((a, b) => (a.nextFollowUpOn ?? '9999').localeCompare(b.nextFollowUpOn ?? '9999'));
  });

  protected setView(v: 'board' | 'list'): void {
    this.view.set(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode - the choice just won't persist */
    }
  }

  protected onDrop(event: CdkDragDrop<Lead[]>, target: Stage): void {
    if (event.previousContainer === event.container) return;
    const lead = event.previousContainer.data[event.previousIndex]!;
    this.move(lead, target);
  }

  protected move(lead: Lead, target: Stage): void {
    if (target === lead.stage) return;
    if (target === 'lost') {
      this.lostReason.set('');
      this.losing.set(lead);
      return;
    }
    this.store.update(lead.id, { stage: target });
  }

  protected confirmLost(): void {
    const lead = this.losing();
    const reason = this.lostReason().trim();
    if (!lead || !reason) return;
    this.store.update(lead.id, { stage: 'lost', lostReason: reason }, () => this.losing.set(null));
  }

  protected open(lead: Lead): void {
    void this.router.navigate(['/leads', lead.id]);
  }

  protected followUp(lead: Lead): { label: string; cls: string } | null {
    const state = followUpState(lead);
    if (state === 'closed') return null;
    if (state === 'none') return { label: 'No follow-up set', cls: 'text-ink-400' };
    const label = state === 'today' ? 'Today' : state === 'overdue' ? 'Overdue · ' + shortDate(lead.nextFollowUpOn) : shortDate(lead.nextFollowUpOn);
    return { label, cls: followUpClass(state) };
  }
}
