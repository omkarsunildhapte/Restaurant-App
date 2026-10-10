import { onlineBlock, onlineBlockMessage } from '@utils/rider-status/rider-status.util';
import { RiderProfile } from '@appTypes/rider.types';
import { SHIFT } from '@constants/shift.constants';

const profile = (overrides: Partial<RiderProfile> = {}): RiderProfile => ({ uid: 'rider-1', riderId: 'r1', tenantId: 't1', displayName: 'Sagar', verification: 'verified', rejectionReason: null, isActive: true, isOnline: false, ...overrides });

describe('onlineBlock', () => {
  it('lets a verified, active rider go online', () => {
    expect(onlineBlock(profile())).toBeNull();
    expect(onlineBlockMessage(null, null)).toBeNull();
  });

  it('blocks until verified, after rejection, and when paused by the restaurant', () => {
    expect(onlineBlock(null)).toBe('not-verified');
    expect(onlineBlock(profile({ verification: 'pending' }))).toBe('not-verified');
    expect(onlineBlock(profile({ verification: 'rejected' }))).toBe('rejected');
    expect(onlineBlock(profile({ isActive: false }))).toBe('blocked');
  });

  it('explains each block', () => {
    expect(onlineBlockMessage('not-verified', null)).toBe(SHIFT.NOT_VERIFIED);
    expect(onlineBlockMessage('rejected', 'Licence photo unclear')).toBe(SHIFT.REJECTED + 'Licence photo unclear');
    expect(onlineBlockMessage('blocked', null)).toBe(SHIFT.BLOCKED);
  });
});
