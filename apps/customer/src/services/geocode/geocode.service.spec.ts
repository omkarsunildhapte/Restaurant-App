import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GEOCODE } from '@constants/geocode.constants';
import { GeocodeService } from '@services/geocode/geocode.service';

describe('GeocodeService', () => {
  let service: GeocodeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(GeocodeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches through the backend and normalises results', () => {
    let out: unknown;
    service.search(' MG Road ').subscribe((r) => (out = r));
    const req = http.expectOne((r) => r.url === 'http://localhost:4000/geocode/search');
    expect(req.request.params.get('q')).toBe('MG Road');
    req.flush({ results: [{ placeId: 7, displayName: 'MG Road, Pune', lat: '18.5', lng: '73.8', address: { city: 'Pune' } }], attribution: GEOCODE.OSM_ATTRIBUTION });
    expect(out).toEqual({ results: [{ placeId: 7, displayName: 'MG Road, Pune', lat: 18.5, lng: 73.8, address: { city: 'Pune' } }], attribution: GEOCODE.OSM_ATTRIBUTION });
  });

  it('reverse-geocodes and tolerates a null result', () => {
    let out: unknown;
    service.reverse(18.5, 73.8).subscribe((r) => (out = r));
    const req = http.expectOne((r) => r.url === 'http://localhost:4000/geocode/reverse');
    expect(req.request.params.get('lat')).toBe('18.5');
    expect(req.request.params.get('lng')).toBe('73.8');
    req.flush({ result: null, attribution: '' });
    expect(out).toEqual({ result: null, attribution: GEOCODE.OSM_ATTRIBUTION });
  });
});
