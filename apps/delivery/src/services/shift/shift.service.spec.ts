import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ShiftService } from '@services/shift/shift.service';
import { SupabaseService } from '@services/supabase/supabase.service';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { LocationService } from '@services/location/location.service';
import { RiderPosition } from '@appTypes/location.types';
import { RiderProfile } from '@appTypes/rider.types';
import { fakeAuthService } from '@testing/doubles';
import { LocationError } from '@utils/errors/errors.util';
import { SHIFT } from '@constants/shift.constants';

const profile: RiderProfile = { uid: 'rider-1', riderId: 'r1', tenantId: 't1', displayName: 'Sagar', verification: 'verified', rejectionReason: null, isActive: true, isOnline: false };
const at = (timestamp: number, lat = 18.56): RiderPosition => ({ lat, lng: 73.77, accuracy: 10, timestamp });

describe('ShiftService', () => {
  function setup(riderProfile: RiderProfile | null = profile) {
    const positions = new Subject<RiderPosition>();
    let onChange: () => void = () => undefined;
    const channel = { on: vi.fn((_e: string, _f: unknown, cb: () => void) => ((onChange = cb), channel)), subscribe: vi.fn(() => channel), unsubscribe: vi.fn() };
    const client = { channel: vi.fn(() => channel) };
    const riders = { getProfile: vi.fn(async () => riderProfile), setOnline: vi.fn(async () => undefined), reportLocation: vi.fn(async () => undefined) };
    const location = { getCurrentPosition: vi.fn(async () => at(1_000)), watchPosition: vi.fn(() => positions.asObservable()) };
    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: { client } },
        { provide: AuthService, useValue: fakeAuthService() },
        { provide: RiderService, useValue: riders },
        { provide: LocationService, useValue: location },
      ],
    });
    return { service: TestBed.inject(ShiftService), riders, location, positions, client, channel, change: () => onChange() };
  }

  it('loads the rider and listens to their own jobs', async () => {
    const { service, client, channel, change } = setup();
    await service.start();
    expect(service.block()).toBeNull();
    expect(client.channel).toHaveBeenCalledWith(SHIFT.JOBS_CHANNEL_PREFIX + 'r1');
    expect(channel.on.mock.calls[0]?.[1]).toMatchObject({ table: 'delivery_jobs', filter: 'rider_id=eq.r1' });
    change();
    expect(service.jobsVersion()).toBe(1);
  });

  it('goes online after reading the position, then reports moves at most every 60 s idle and 10 s on a job', async () => {
    const { service, riders, positions } = setup();
    await service.start();
    await service.goOnline();
    expect(service.online()).toBe(true);
    expect(riders.setOnline).toHaveBeenCalledWith(true);
    expect(riders.reportLocation).toHaveBeenCalledTimes(1);

    positions.next(at(31_000, 18.561));
    positions.next(at(61_000, 18.562));
    await Promise.resolve();
    expect(riders.reportLocation).toHaveBeenCalledTimes(2);

    service.setActiveJob('job-1');
    positions.next(at(72_000, 18.563));
    await Promise.resolve();
    expect(riders.reportLocation).toHaveBeenLastCalledWith({ lat: 18.563, lng: 73.77 }, 'job-1');
  });

  it('skips a rider standing still until the 90 s heartbeat', async () => {
    const { service, riders, positions } = setup();
    await service.goOnline();
    positions.next(at(61_000));
    positions.next(at(80_000));
    await Promise.resolve();
    expect(riders.reportLocation).toHaveBeenCalledTimes(1);
    positions.next(at(1_000 + SHIFT.HEARTBEAT_MS));
    await Promise.resolve();
    expect(riders.reportLocation).toHaveBeenCalledTimes(2);
  });

  it('stays offline and says why when location is denied', async () => {
    const { service, riders, location } = setup();
    location.getCurrentPosition.mockRejectedValueOnce(new LocationError('permission-denied'));
    await service.goOnline();
    expect(service.online()).toBe(false);
    expect(riders.setOnline).not.toHaveBeenCalled();
    expect(service.error()).toContain('Location permission is off');
  });

  it('stops sharing position when going offline', async () => {
    const { service, riders, positions } = setup();
    await service.goOnline();
    await service.goOffline();
    positions.next(at(500_000));
    await Promise.resolve();
    expect(service.online()).toBe(false);
    expect(riders.setOnline).toHaveBeenLastCalledWith(false);
    expect(riders.reportLocation).toHaveBeenCalledTimes(1);
  });

  it('blocks an unverified rider and listens to nothing without a profile', async () => {
    const { service, client } = setup(null);
    await service.start();
    expect(service.block()).toBe('not-verified');
    expect(client.channel).not.toHaveBeenCalled();
  });
});
