import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { environment } from 'src/environments/environment';

/** Attribution required by the OpenStreetMap licence wherever geocoded results are shown. */
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

export interface GeocodeAddress {
  houseNumber?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  countryCode?: string;
}

export interface GeocodeResult {
  /** Nominatim place_id */
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
  address: GeocodeAddress;
}

export interface GeocodeSearchResponse {
  results: GeocodeResult[];
  attribution: string;
}

export interface GeocodeReverseResponse {
  result: GeocodeResult | null;
  attribution: string;
}

export class GeocodeUnavailableError extends Error {
  constructor(public readonly cause?: unknown) {
    super('Address lookup not available yet');
    this.name = 'GeocodeUnavailableError';
  }
}

/**
 * Geocoding through our backend, which proxies OpenStreetMap Nominatim
 * (Nominatim's usage policy forbids calling it from every phone).
 *
 * Call search() only on an explicit submit (no search-as-you-type) and reverse() only on a
 * user tap, never on every position update. Show OSM_ATTRIBUTION next to the results.
 * Any failure is reported as GeocodeUnavailableError ("Address lookup not available yet").
 */
@Injectable({ providedIn: 'root' })
export class GeocodeService {
  private readonly baseUrl = `${environment.apiUrl}/geocode`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  search(query: string): Observable<GeocodeSearchResponse> {
    const q = query.trim();
    if (!q) {
      return throwError(() => new Error('Enter an address to search.'));
    }
    const params = new HttpParams().set('q', q);
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GeocodeSearchResponse>(`${this.baseUrl}/search`, { params, headers }),
      ),
      map((res) => ({
        results: Array.isArray(res?.results) ? res.results : [],
        attribution: res?.attribution || OSM_ATTRIBUTION,
      })),
      catchError((error) => throwError(() => new GeocodeUnavailableError(error))),
    );
  }

  reverse(lat: number, lng: number): Observable<GeocodeReverseResponse> {
    const params = new HttpParams().set('lat', String(lat)).set('lng', String(lng));
    return this.authHeaders().pipe(
      switchMap((headers) =>
        this.http.get<GeocodeReverseResponse>(`${this.baseUrl}/reverse`, { params, headers }),
      ),
      map((res) => ({
        result: res?.result ?? null,
        attribution: res?.attribution || OSM_ATTRIBUTION,
      })),
      catchError((error) => throwError(() => new GeocodeUnavailableError(error))),
    );
  }

  /** Bearer header from the current Supabase session (the backend requires it). */
  private authHeaders(): Observable<HttpHeaders> {
    return from(this.auth.getSession()).pipe(
      map((session) => {
        if (!session) {
          throw new Error('Sign in to look up addresses.');
        }
        return new HttpHeaders({ Authorization: `Bearer ${session.access_token}` });
      }),
    );
  }
}
