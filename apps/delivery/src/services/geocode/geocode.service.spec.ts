import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { GeocodeService } from '@services/geocode/geocode.service';
import { GeocodeUnavailableError } from '@utils/errors/errors.util';
import { GEOCODE } from '@constants/geocode.constants';

describe('GeocodeService', () => {
  let service: GeocodeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GeocodeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches through the backend and keeps the attribution', async () => {
    const result = firstValueFrom(service.search('  Andheri  '));
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}${GEOCODE.SEARCH_PATH}`);
    expect(req.request.params.get(GEOCODE.QUERY_PARAM)).toBe('Andheri');
    req.flush({ results: [{ placeId: 1, displayName: 'Andheri', lat: 19.1, lng: 72.8, address: {} }], attribution: '' });
    await expect(result).resolves.toEqual({ results: [{ placeId: 1, displayName: 'Andheri', lat: 19.1, lng: 72.8, address: {} }], attribution: GEOCODE.ATTRIBUTION });
  });

  it('refuses an empty query without a request', async () => {
    await expect(firstValueFrom(service.search('   '))).rejects.toThrowError();
  });

  it('reverse-geocodes one point', async () => {
    const result = firstValueFrom(service.reverse(19.1, 72.8));
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}${GEOCODE.REVERSE_PATH}`);
    expect(req.request.params.get(GEOCODE.LAT_PARAM)).toBe('19.1');
    req.flush({ result: null, attribution: 'OSM' });
    await expect(result).resolves.toEqual({ result: null, attribution: 'OSM' });
  });

  it('reports any failure as GeocodeUnavailableError', async () => {
    const result = firstValueFrom(service.reverse(1, 2));
    http.expectOne(() => true).flush('down', { status: 503, statusText: 'Unavailable' });
    await expect(result).rejects.toBeInstanceOf(GeocodeUnavailableError);
  });
});
