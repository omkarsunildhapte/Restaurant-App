import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocationService } from '@services/location/location.service';
import { LocationError } from '@utils/location-error/location-error.util';

const geo = vi.hoisted(() => ({ getCurrentPosition: vi.fn(), requestPermissions: vi.fn(), native: false }));

vi.mock('@capacitor/geolocation', () => ({ Geolocation: { getCurrentPosition: geo.getCurrentPosition, requestPermissions: geo.requestPermissions } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => geo.native } }));

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    geo.getCurrentPosition.mockReset();
    geo.requestPermissions.mockReset();
    geo.native = false;
    service = TestBed.inject(LocationService);
  });

  it('returns the position with the agreed options', async () => {
    geo.getCurrentPosition.mockResolvedValue({ coords: { latitude: 18.5, longitude: 73.8, accuracy: 12 } });
    await expect(service.getCurrentPosition()).resolves.toEqual({ lat: 18.5, lng: 73.8, accuracy: 12 });
    expect(geo.getCurrentPosition).toHaveBeenCalledWith({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  it('maps failures to a LocationError, with one attempt only', async () => {
    geo.getCurrentPosition.mockRejectedValue({ code: 1, message: 'User denied Geolocation' });
    const e = (await service.getCurrentPosition().catch((x: unknown) => x)) as LocationError;
    expect(e.kind).toBe('permission-denied');
    expect(e.message).toBe('Location permission is off. Type your address instead.');
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('asks for permission first on native and stops when denied', async () => {
    geo.native = true;
    geo.requestPermissions.mockResolvedValue({ location: 'denied', coarseLocation: 'denied' });
    const e = (await service.getCurrentPosition().catch((x: unknown) => x)) as LocationError;
    expect(e.kind).toBe('permission-denied');
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('is unavailable during server rendering', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const e = (await TestBed.inject(LocationService).getCurrentPosition().catch((x: unknown) => x)) as LocationError;
    expect(e.kind).toBe('unavailable');
  });
});
