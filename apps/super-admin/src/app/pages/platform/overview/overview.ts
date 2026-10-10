import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlatformApi } from '@app/core/platform/platform.api';
import {
  STATUSES,
  STATUS_LABEL,
  daysLeft,
  rupees,
  shortDate,
  statusClass,
  type PlatformStats,
} from '@app/core/platform/platform.models';

/** Platform health at a glance: restaurants by status, revenue from plans, trials ending. */
@Component({
  selector: 'app-platform-overview',
  imports: [RouterLink],
  templateUrl: './overview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformOverview implements OnInit {
  private readonly api = inject(PlatformApi);

  protected readonly stats = signal<PlatformStats | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly statuses = STATUSES;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statusClass = statusClass;
  protected readonly rupees = rupees;
  protected readonly daysLeft = daysLeft;
  protected readonly shortDate = shortDate;

  public ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.stats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
}
