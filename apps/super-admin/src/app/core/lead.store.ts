import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '@app/core/api.client';
import {
  STAGES,
  type Activity,
  type Lead,
  type LeadInput,
  type Paginated,
  type Stage,
} from '@app/core/crm';

/**
 * Every lead, loaded once and held as signals. Pipeline, follow-ups and areas are all
 * views over this one list, so a stage change on one page shows on every other at once.
 * At a few thousand restaurants this is still one small request; past that, the pages
 * would switch to the API's own filters.
 */
@Injectable({ providedIn: 'root' })
export class LeadStore {
  private readonly api = inject(ApiClient);

  private readonly _leads = signal<readonly Lead[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _saving = signal(false);

  readonly leads = this._leads.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();

  readonly byStage = computed<Record<Stage, readonly Lead[]>>(() => {
    const groups = {} as Record<Stage, Lead[]>;
    for (const stage of STAGES) groups[stage] = [];
    for (const lead of this._leads()) groups[lead.stage].push(lead);
    return groups;
  });

  public load(): void {
    this._loading.set(true);
    this._error.set(null);

    this.api.get<Paginated<Lead>>('/leads', { limit: '1000' }).subscribe({
      next: (page) => {
        this._leads.set(page.items);
        this._loading.set(false);
        this._loaded.set(true);
      },
      error: (error: Error) => {
        this._error.set(error.message);
        this._loading.set(false);
        this._loaded.set(true);
      },
    });
  }

  /** Loads only when nothing has been loaded yet - for pages that just need the list. */
  public ensureLoaded(): void {
    if (!this._loaded() && !this._loading()) this.load();
  }

  public find(id: string): Lead | undefined {
    return this._leads().find((l) => l.id === id);
  }

  public fetch(id: string): Observable<Lead> {
    return this.api.get<Lead>('/leads/' + id).pipe(tap((lead) => this.upsert(lead)));
  }

  public create(input: Partial<LeadInput>, done: (lead: Lead | null) => void): void {
    this._saving.set(true);
    this._error.set(null);

    this.api.post<Lead>('/leads', input).subscribe({
      next: (lead) => {
        this._leads.update((list) => [lead, ...list]);
        this._saving.set(false);
        done(lead);
      },
      error: (error: Error) => {
        this._error.set(error.message);
        this._saving.set(false);
        done(null);
      },
    });
  }

  public update(id: string, patch: Partial<LeadInput>, done: (ok: boolean) => void = () => {}): void {
    this._saving.set(true);
    this._error.set(null);

    this.api.patch<Lead>('/leads/' + id, patch).subscribe({
      next: (lead) => {
        this.upsert(lead);
        this._saving.set(false);
        done(true);
      },
      error: (error: Error) => {
        this._error.set(error.message);
        this._saving.set(false);
        done(false);
      },
    });
  }

  public remove(id: string, done: (ok: boolean) => void = () => {}): void {
    const previous = this._leads();
    // Removed first so the row disappears on click, and put back if the server refuses.
    this._leads.update((list) => list.filter((l) => l.id !== id));

    this.api.delete('/leads/' + id).subscribe({
      next: () => done(true),
      error: (error: Error) => {
        this._leads.set(previous);
        this._error.set(error.message);
        done(false);
      },
    });
  }

  public activities(id: string): Observable<Activity[]> {
    return this.api.get<Activity[]>('/leads/' + id + '/activities');
  }

  public logActivity(
    id: string,
    body: Record<string, unknown>,
  ): Observable<{ activity: Activity; lead: Lead }> {
    return this.api
      .post<{ activity: Activity; lead: Lead }>('/leads/' + id + '/activities', body)
      .pipe(tap((result) => this.upsert(result.lead)));
  }

  /** After the Super Admin app created the restaurant: link it to the lead and start the trial. */
  public markConverted(id: string, tenantId: string): Observable<Lead> {
    return this.api.post<Lead>('/leads/' + id + '/conversion', { tenantId }).pipe(tap((lead) => this.upsert(lead)));
  }

  public removeActivity(leadId: string, activityId: string): Observable<void> {
    return this.api.delete('/leads/' + leadId + '/activities/' + activityId);
  }

  public import(
    rows: Record<string, unknown>[],
    source: string,
  ): Observable<{ created: number; skipped: { row: number; reason: string }[] }> {
    return this.api
      .post<{ created: number; skipped: { row: number; reason: string }[] }>('/leads/import', { rows, source })
      .pipe(tap(() => this.load()));
  }

  public clearError(): void {
    this._error.set(null);
  }

  private upsert(lead: Lead): void {
    this._leads.update((list) =>
      list.some((l) => l.id === lead.id) ? list.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...list],
    );
  }
}
