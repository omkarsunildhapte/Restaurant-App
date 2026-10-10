import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { GEOLOCATION_PLUGIN, IS_NATIVE_PLATFORM, LocationService } from '@services/location/location.service';
import { LocationError } from '@utils/errors/errors.util';

const position = { timestamp: 5, coords: { latitude: 19.1, longitude: 72.8, accuracy: 10, altitude: null, altitudeAccuracy: null, speed: null, heading: null } };

function setup(options: { native?: boolean; platform?: string } = {}) {
  const plugin = {
    getCurrentPosition: vi.fn(async () => position),
    requestPermissions: vi.fn(async () => ({ location: 'granted', coarseLocation: 'granted' })),
    watchPosition: vi.fn(async (_options: unknown, callback: (p: typeof position | null, e?: unknown) => void) => {
      callback(position);
      return 'watch-1';
    }),
    clearWatch: vi.fn(async () => undefined),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: GEOLOCATION_PLUGIN, useValue: plugin },
      { provide: IS_NATIVE_PLATFORM, useValue: () => options.native ?? false },
      { provide: PLATFORM_ID, useValue: options.platform ?? 'browser' },
    ],
  });
  return { plugin, service: TestBed.inject(LocationService) };
}

describe('LocationService', () => {
  it('reads the position on the web without asking for permission', async () => {
    const { plugin, service } = setup();
    await expect(service.getCurrentPosition()).resolves.toEqual({ lat: 19.1, lng: 72.8, accuracy: 10, timestamp: 5 });
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
  });

  it('asks for permission on native and reports a denial', async () => {
    const { plugin, service } = setup({ native: true });
    plugin.requestPermissions.mockResolvedValue({ location: 'denied', coarseLocation: 'denied' });
    await expect(service.getCurrentPosition()).rejects.toMatchObject({ reason: 'permission-denied' });
  });

  it('maps a plugin timeout', async () => {
    const { plugin, service } = setup();
    plugin.getCurrentPosition.mockRejectedValue({ code: 3, message: 'Timeout expired' });
    await expect(service.getCurrentPosition()).rejects.toMatchObject({ reason: 'timeout' });
  });

  it('is unavailable during SSR', async () => {
    const { service } = setup({ platform: 'server' });
    await expect(service.getCurrentPosition()).rejects.toBeInstanceOf(LocationError);
  });

  it('watches the position and clears the watch on unsubscribe', async () => {
    const { plugin, service } = setup();
    await expect(firstValueFrom(service.watchPosition())).resolves.toMatchObject({ lat: 19.1 });
    await vi.waitFor(() => expect(plugin.clearWatch).toHaveBeenCalledWith({ id: 'watch-1' }));
  });
});
