import { OnlineBlock, RiderProfile } from '@appTypes/rider.types';
import { SHIFT } from '@constants/shift.constants';

/** Why this rider cannot go online yet (no profile counts as not verified), or null. */
export function onlineBlock(profile: RiderProfile | null): OnlineBlock {
  if (!profile || profile.verification === 'pending') {
    return 'not-verified';
  }
  if (profile.verification === 'rejected') {
    return 'rejected';
  }
  return profile.isActive ? null : 'blocked';
}

/** What to tell the rider about a block. */
export function onlineBlockMessage(block: OnlineBlock, rejectionReason: string | null): string | null {
  switch (block) {
    case 'not-verified':
      return SHIFT.NOT_VERIFIED;
    case 'rejected':
      return SHIFT.REJECTED + (rejectionReason ?? '');
    case 'blocked':
      return SHIFT.BLOCKED;
    default:
      return null;
  }
}
