import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth/auth.service';

export interface GeocodeAddress {
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export interface GeocodeResult {
  /** Nominatim place_id. */
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

/** Attribution that must be shown wherever geocoded results are displayed (fallback if the API omits it). */
export const OSM_ATTRIBUTION = '© OpenStreetMap contributors';

/** Message shown when the backend geocoder is unreachable. */
export const GEOCODE_UNAVAILABLE = 'Address lookup not available yet';

/**
 * Geocoding through our backend (`${apiUrl}/geocode/*`), which proxies OpenStreetMap Nominatim.
 * Never call Nominatim (or Google geocoding) directly from the app, and only call
 * search() on an explicit submit (button / Enter), never per keystroke.
 * Requests carry the Supabase access token as a Bearer header.
 */
@Injectable({ providedIn: 'root' })
export class GeocodeService {
  private readonly baseUrl = `${environment.apiUrl}/geocode`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  search(query: string): Observable<GeocodeSearchResponse> {
    const params = new HttpParams().set('q', query.trim());
    return this.http
      .get<GeocodeSearchResponse>(`${this.baseUrl}/search`, { params, headers: this.headers() })
      .pipe(
        map((res) => ({
          results: (res?.results ?? []).map(normalize),
          attribution: res?.attribution || OSM_ATTRIBUTION,
        }))
      );
  }

  reverse(lat: number, lng: number): Observable<GeocodeReverseResponse> {
    const params = new HttpParams().set('lat', String(lat)).set('lng', String(lng));
    return this.http
      .get<GeocodeReverseResponse>(`${this.baseUrl}/reverse`, { params, headers: this.headers() })
      .pipe(
        map((res) => ({
          result: res?.result ? normalize(res.result) : null,
          attribution: res?.attribution || OSM_ATTRIBUTION,
        }))
      );
  }

  private headers(): HttpHeaders {
    const token = this.auth.accessToken;
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}

function normalize(r: GeocodeResult): GeocodeResult {
  return {
    placeId: Number(r.placeId),
    displayName: r.displayName ?? '',
    lat: Number(r.lat),
    lng: Number(r.lng),
    address: r.address ?? {},
  };
}
