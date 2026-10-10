import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiClient } from '@app/core/api.client';
import { SOURCE_LABEL, STAGE_LABEL, money, type Source, type Stage, type Summary } from '@app/core/crm';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly api = inject(ApiClient);

  protected readonly summary = signal<Summary | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);

  protected readonly money = money;

  /** Widest funnel bar = the "new" count, so every other bar is a share of it. */
  protected readonly funnelMax = computed(() => Math.max(1, ...(this.summary()?.funnel.map((f) => f.reached) ?? [1])));
  protected readonly sourceMax = computed(() => Math.max(1, ...(this.summary()?.bySource.map((s) => s.total) ?? [1])));

  public ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<Summary>('/reports/summary').subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }

  protected stageLabel(stage: Stage): string {
    return STAGE_LABEL[stage];
  }

  protected sourceLabel(source: Source): string {
    return SOURCE_LABEL[source];
  }

  protected pct(part: number, whole: number): number {
    return whole ? Math.round((part * 100) / whole) : 0;
  }
}
