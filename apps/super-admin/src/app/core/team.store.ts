import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiClient } from '@app/core/api.client';
import type { Dealer, TeamMember } from '@app/core/crm';

/** The sales team and the dealers/partners, both small lists loaded whole. */
@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(ApiClient);

  private readonly _users = signal<readonly TeamMember[]>([]);
  private readonly _dealers = signal<readonly Dealer[]>([]);
  private readonly _error = signal<string | null>(null);

  readonly users = this._users.asReadonly();
  readonly dealers = this._dealers.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeUsers = computed(() => this._users().filter((u) => u.isActive));
  readonly activeDealers = computed(() => this._dealers().filter((d) => d.isActive));

  public loadUsers(): void {
    this.api.get<TeamMember[]>('/users').subscribe({
      next: (users) => this._users.set(users),
      error: (e: Error) => this._error.set(e.message),
    });
  }

  public loadDealers(): void {
    this.api.get<Dealer[]>('/dealers').subscribe({
      next: (dealers) => this._dealers.set(dealers),
      error: (e: Error) => this._error.set(e.message),
    });
  }

  public createUser(body: { email: string; name: string; role: string }): Observable<TeamMember> {
    return this.api.post<TeamMember>('/users', body).pipe(tap(() => this.loadUsers()));
  }

  public setUserActive(id: string, isActive: boolean): Observable<TeamMember> {
    return this.api.patch<TeamMember>('/users/' + id, { isActive }).pipe(tap(() => this.loadUsers()));
  }

  public saveDealer(id: string | null, body: Partial<Dealer>): Observable<Dealer> {
    const request = id ? this.api.patch<Dealer>('/dealers/' + id, body) : this.api.post<Dealer>('/dealers', body);
    return request.pipe(
      tap((dealer) =>
        this._dealers.update((list) =>
          list.some((d) => d.id === dealer.id) ? list.map((d) => (d.id === dealer.id ? dealer : d)) : [...list, dealer],
        ),
      ),
    );
  }
}
