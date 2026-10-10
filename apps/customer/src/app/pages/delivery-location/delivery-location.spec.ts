import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { DeliveryLocation } from '@pages/delivery-location/delivery-location';
import { GEOCODE } from '@constants/geocode.constants';
import { LocationService } from '@services/location/location.service';
import { LocationError } from '@utils/location-error/location-error.util';
import { renderPage, tick } from '@testing/test-providers';

const RESULT = { placeId: 7, displayName: 'MG Road, Pune', lat: 18.5, lng: 73.8, address: { road: 'MG Road', city: 'Pune' } };

describe('DeliveryLocation', () => {
  async function open(position: () => Promise<unknown> = () => Promise.resolve({ lat: 18.5, lng: 73.8, accuracy: 5 })) {
    const page = await renderPage(DeliveryLocation, { providers: [{ provide: LocationService, useValue: { getCurrentPosition: vi.fn(position) } }] });
    return { ...page, http: TestBed.inject(HttpTestingController) };
  }

  it('prefills the address from "Use my location" (one reverse-geocode call)', async () => {
    const { fixture, element, http } = await open();
    await fixture.componentInstance.useMyLocation();
    await tick(fixture);
    http.expectOne((r) => r.url.endsWith('/geocode/reverse')).flush({ result: RESULT, attribution: GEOCODE.OSM_ATTRIBUTION });
    await tick(fixture);
    expect(fixture.componentInstance.addressForm.city().value()).toBe('Pune');
    expect(element.textContent).toContain(GEOCODE.OSM_ATTRIBUTION);
    http.verify();
  });

  it('explains a denied permission and keeps the form open', async () => {
    const { fixture, element } = await open(() => Promise.reject(new LocationError('permission-denied')));
    await fixture.componentInstance.useMyLocation();
    await tick(fixture);
    expect(element.textContent).toContain('Location permission is off. Type your address instead.');
    expect(element.querySelectorAll('ion-input').length).toBeGreaterThan(1);
  });

  it('searches only on submit, lists results and fills the form when one is picked', async () => {
    const { fixture, element, http } = await open();
    fixture.componentInstance.searchForm.query().value.set('MG Road');
    await tick(fixture);
    http.expectNone((r) => r.url.endsWith('/geocode/search'));
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await tick(fixture);
    http.expectOne((r) => r.url.endsWith('/geocode/search')).flush({ results: [RESULT], attribution: GEOCODE.OSM_ATTRIBUTION });
    await tick(fixture);
    expect(fixture.componentInstance.results().length).toBe(1);
    fixture.componentInstance.select(fixture.componentInstance.results()[0]);
    await tick(fixture);
    expect(fixture.componentInstance.addressForm.road().value()).toBe('MG Road');
  });

  it('says the lookup is not available when the backend fails', async () => {
    const { fixture, element, http } = await open();
    fixture.componentInstance.searchForm.query().value.set('MG Road');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await tick(fixture);
    http.expectOne((r) => r.url.endsWith('/geocode/search')).flush('down', { status: 503, statusText: 'Unavailable' });
    await tick(fixture);
    expect(element.textContent).toContain('Address lookup not available yet. Type your address below.');
  });
});
