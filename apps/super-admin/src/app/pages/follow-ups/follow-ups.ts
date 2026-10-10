import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@app/core/auth.store';
import { LeadStore } from '@app/core/lead.store';
import {
  RESTAURANT_TYPE_LABEL,
  STAGE_LABEL,
  followUpState,
  shortDate,
  stageClass,
  todayIso,
  type Lead,
} from '@app/core/crm';

/** Today's call and visit list: overdue first, then today, then the open leads with no date. */
@Component({
  selector: 'app-follow-ups',
  imports: [FormsModule, RouterLink],
  templateUrl: './follow-ups.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FollowUps implements OnInit {
  protected readonly store = inject(LeadStore);
  protected readonly auth = inject(AuthStore);

  protected readonly stageLabel = STAGE_LABEL;
  protected readonly typeLabel = RESTAURANT_TYPE_LABEL;
  protected readonly stageClass = stageClass;
  protected readonly shortDate = shortDate;

  /** Off by default for admins (who plan for everyone), on for salespeople. */
  protected readonly mineOnly = signal(false);

  public ngOnInit(): void {
    this.mineOnly.set(!this.auth.isAdmin());
    this.store.load();
  }

  private readonly scoped = computed(() => {
    const me = this.auth.user()?.id;
    return this.mineOnly() ? this.store.leads().filter((l) => l.assignedTo === me) : this.store.leads();
  });

  private bucket(state: ReturnType<typeof followUpState>): Lead[] {
    return this.scoped()
      .filter((l) => followUpState(l) === state)
      .sort((a, b) => (a.nextFollowUpOn ?? '').localeCompare(b.nextFollowUpOn ?? '') || (a.area ?? '').localeCompare(b.area ?? ''));
  }

  protected readonly groups = computed(() => [
    { key: 'overdue', title: 'Overdue', cls: 'text-rose-600 dark:text-rose-400', leads: this.bucket('overdue') },
    { key: 'today', title: 'Today', cls: 'text-amber-600 dark:text-amber-400', leads: this.bucket('today') },
    { key: 'none', title: 'No follow-up set', cls: 'text-ink-500 dark:text-ink-400', leads: this.bucket('none') },
  ]);

  /** Push a lead's follow-up out without opening it ("call back tomorrow"). */
  protected snooze(lead: Lead, days: number): void {
    this.store.update(lead.id, { nextFollowUpOn: todayIso(days) });
  }
}
