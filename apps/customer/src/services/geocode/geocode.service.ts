import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import { GeocodeResult, GeocodeReverseResponse, GeocodeSearchResponse } from '@appTypes/geocode.types';
import { API_ENDPOINTS, API_PARAMS } from '@constants/api.constants';
import { GEOCODE } from '@constants/geocode.constants';

/**
 * Geocoding through our backend, which proxies OpenStreetMap Nominatim. Never call Nominatim (or
 * Google geocoding) from the app; search only on an explicit submit (Rule 17). The Supabase bearer
 * token is added by the api-auth interceptor.
 */
@Injectable({ providedIn: 'root' })
export class GeocodeService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<GeocodeSearchResponse> {
    const params = new HttpParams().set(API_PARAMS.QUERY, query.trim());
    return this.http.get<GeocodeSearchResponse>(environment.apiUrl + API_ENDPOINTS.GEOCODE_SEARCH, { params }).pipe(
      map((res) => ({ results: (res?.results ?? []).map(normalize), attribution: res?.attribution || GEOCODE.OSM_ATTRIBUTION })),
    );
  }

  reverse(lat: number, lng: number): Observable<GeocodeReverseResponse> {
    const params = new HttpParams().set(API_PARAMS.LAT, String(lat)).set(API_PARAMS.LNG, String(lng));
    return this.http.get<GeocodeReverseResponse>(environment.apiUrl + API_ENDPOINTS.GEOCODE_REVERSE, { params }).pipe(
      map((res) => ({ result: res?.result ? normalize(res.result) : null, attribution: res?.attribution || GEOCODE.OSM_ATTRIBUTION })),
    );
  }
}

function normalize(r: GeocodeResult): GeocodeResult {
  return { placeId: Number(r.placeId), displayName: r.displayName ?? '', lat: Number(r.lat), lng: Number(r.lng), address: r.address ?? {} };
}
