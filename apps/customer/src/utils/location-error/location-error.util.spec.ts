import { LOCATION_MESSAGES } from '@constants/location.constants';
import { LocationError, toLocationError } from '@utils/location-error/location-error.util';

describe('toLocationError', () => {
  it.each([
    [{ code: 1, message: '' }, 'permission-denied'],
    [{ message: 'Location permission was denied' }, 'permission-denied'],
    [{ code: 3, message: '' }, 'timeout'],
    [{ message: 'Request timed out' }, 'timeout'],
    [{ code: 2, message: '' }, 'unavailable'],
    [{ message: 'Location services are disabled' }, 'unavailable'],
    [{ message: 'something else' }, 'unknown'],
    [null, 'unknown'],
  ] as const)('maps %o to %s', (input, kind) => {
    const error = toLocationError(input);
    expect(error).toBeInstanceOf(LocationError);
    expect(error.kind).toBe(kind);
    expect(error.message).toBe(LOCATION_MESSAGES[kind]);
  });

  it('passes a LocationError through', () => {
    const original = new LocationError('timeout');
    expect(toLocationError(original)).toBe(original);
  });
});
