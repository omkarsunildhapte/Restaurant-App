import { TestBed } from '@angular/core/testing';
import { LocationError, LocationService } from './location.service';

const geo = vi.hoisted(() => ({
  getCurrentPosition: vi.fn(),
  requestPermissions: vi.fn(),
  native: false,
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: { getCurrentPosition: geo.getCurrentPosition, requestPermissions: geo.requestPermissions },
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => geo.native } }));

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(() => {
    geo.getCurrentPosition.mockReset();
    geo.requestPermissions.mockReset();
    geo.native = false;
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocationService);
  });

  it('returns the position with the agreed options', async () => {
    geo.getCurrentPosition.mockResolvedValue({ coords: { latitude: 18.5, longitude: 73.8, accuracy: 12 } });
    await expect(service.getCurrentPosition()).resolves.toEqual({ lat: 18.5, lng: 73.8, accuracy: 12 });
    expect(geo.getCurrentPosition).toHaveBeenCalledWith({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  it.each([
    [{ code: 1, message: 'User denied Geolocation' }, 'permission-denied', 'Location permission is off. Type your address instead.'],
    [{ code: 3, message: 'Timeout expired' }, 'timeout', undefined],
    [{ code: 2, message: 'Position unavailable' }, 'unavailable', undefined],
  ])('maps %o to %s', async (err, kind, message) => {
    geo.getCurrentPosition.mockRejectedValue(err);
    const e = (await service.getCurrentPosition().catch((x) => x)) as LocationError;
    expect(e).toBeInstanceOf(LocationError);
    expect(e.kind).toBe(kind);
    if (message) expect(e.message).toBe(message);
    expect(geo.getCurrentPosition).toHaveBeenCalledTimes(1); // no retries
  });

  it('asks for permission first on native and stops when denied', async () => {
    geo.native = true;
    geo.requestPermissions.mockResolvedValue({ location: 'denied', coarseLocation: 'denied' });
    const e = (await service.getCurrentPosition().catch((x) => x)) as LocationError;
    expect(e.kind).toBe('permission-denied');
    expect(geo.getCurrentPosition).not.toHaveBeenCalled();
  });
});
