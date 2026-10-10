import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Features, NewTenant, Plan, PlatformStats, TenantDetail, TenantRole, TenantRow, TenantStatus } from './platform.models';

const BASE = environment.platformApiUrl;

/**
 * Client for the Node platform API (/platform/v1). The shared auth interceptor attaches the
 * Supabase access token; the API answers in plain JSON with {"error": "..."} on failure.
 */
@Injectable({ providedIn: 'root' })
export class PlatformApi {
  private readonly http = inject(HttpClient);

  public stats(): Observable<PlatformStats> {
    return this.get('/admin/stats');
  }

  public plans(): Observable<Plan[]> {
    return this.get('/admin/plans');
  }

  public updatePlan(id: string, body: { name?: string; priceMonthly?: number; maxOutlets?: number | null; features?: Features; isActive?: boolean }): Observable<Plan> {
    return this.send('PATCH', '/admin/plans/' + id, body);
  }

  public tenants(filter: { status?: TenantStatus | ''; q?: string } = {}): Observable<TenantRow[]> {
    const params: Record<string, string> = {};
    if (filter.status) params['status'] = filter.status;
    if (filter.q) params['q'] = filter.q;
    return this.get('/admin/tenants', params);
  }

  public tenant(id: string): Observable<TenantDetail> {
    return this.get('/admin/tenants/' + id);
  }

  public updateTenant(id: string, body: { planId?: string; status?: TenantStatus; trialEndsAt?: string | null; featureOverrides?: Features }): Observable<unknown> {
    return this.send('PATCH', '/admin/tenants/' + id, body);
  }

  public saveNotes(id: string, notes: string): Observable<{ notes: string }> {
    return this.send('PUT', '/admin/tenants/' + id + '/notes', { notes });
  }

  public createTenant(body: NewTenant): Observable<{ tenant_id: string; outlet_id: string; owner: 'added' | 'invited' }> {
    return this.send('POST', '/tenants', body);
  }

  public inviteMember(tenantId: string, body: { email: string; role: TenantRole; outletId?: string | null }): Observable<{ status: string }> {
    return this.send('POST', '/tenants/' + tenantId + '/members', body);
  }

  public resendInvitation(id: string): Observable<{ status: string }> {
    return this.send('POST', '/invitations/' + id + '/resend', {});
  }

  private get<T>(path: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>(BASE + path, { params }).pipe(catchError(toMessage));
  }

  private send<T>(method: 'POST' | 'PATCH' | 'PUT', path: string, body: unknown): Observable<T> {
    return this.http.request<T>(method, BASE + path, { body }).pipe(catchError(toMessage));
  }
}

function toMessage(error: HttpErrorResponse): Observable<never> {
  if (error.status === 0) {
    return throwError(() => new Error('Cannot reach the platform API at ' + BASE + '. Is it running?'));
  }
  const message = (error.error as { error?: string } | null)?.error ?? 'Request failed with status ' + error.status;
  return throwError(() => new Error(message));
}
