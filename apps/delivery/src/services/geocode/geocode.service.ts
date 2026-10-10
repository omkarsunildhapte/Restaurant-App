import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { GeocodeReverseResponse, GeocodeSearchResponse } from '@appTypes/geocode.types';
import { GeocodeUnavailableError } from '@utils/errors/errors.util';
import { GEOCODE } from '@constants/geocode.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';

/**
 * Geocoding through the backend, which proxies OpenStreetMap Nominatim (Nominatim's policy
 * forbids calling it from every phone). search() only on an explicit submit, reverse() only on a
 * user tap. Show GEOCODE.ATTRIBUTION next to results. The Bearer token is added by
 * authTokenInterceptor. Any failure becomes GeocodeUnavailableError.
 *
 * Not used by a page yet: kept for the Phase 5 address work (user rule on geocoding).
 */
@Injectable({ providedIn: 'root' })
export class GeocodeService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<GeocodeSearchResponse> {
    const q = query.trim();
    if (!q) {
      return throwError(() => new Error(ERROR_MESSAGES.ADDRESS_QUERY_EMPTY));
    }
    const params = new HttpParams().set(GEOCODE.QUERY_PARAM, q);
    return this.http.get<GeocodeSearchResponse>(`${environment.apiUrl}${GEOCODE.SEARCH_PATH}`, { params }).pipe(
      map((res) => ({ results: Array.isArray(res?.results) ? res.results : [], attribution: res?.attribution || GEOCODE.ATTRIBUTION })),
      catchError((error: unknown) => throwError(() => new GeocodeUnavailableError(error))),
    );
  }

  reverse(lat: number, lng: number): Observable<GeocodeReverseResponse> {
    const params = new HttpParams().set(GEOCODE.LAT_PARAM, String(lat)).set(GEOCODE.LNG_PARAM, String(lng));
    return this.http.get<GeocodeReverseResponse>(`${environment.apiUrl}${GEOCODE.REVERSE_PATH}`, { params }).pipe(
      map((res) => ({ result: res?.result ?? null, attribution: res?.attribution || GEOCODE.ATTRIBUTION })),
      catchError((error: unknown) => throwError(() => new GeocodeUnavailableError(error))),
    );
  }
}
