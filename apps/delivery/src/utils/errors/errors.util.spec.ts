import { AuthServiceError, GeocodeUnavailableError, LocationError, NotImplementedError, errorMessage, isNotImplemented, toLocationError } from '@utils/errors/errors.util';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { LOCATION_MESSAGES } from '@constants/location.constants';

describe('errors.util', () => {
  it('NotImplementedError names the operation and is detected', () => {
    const error = new NotImplementedError('save things');
    expect(error.message).toBe(`${ERROR_MESSAGES.NOT_CONNECTED}: save things`);
    expect(isNotImplemented(error)).toBe(true);
    expect(isNotImplemented(new Error('x'))).toBe(false);
  });

  it('AuthServiceError keeps the Supabase code', () => {
    expect(new AuthServiceError('nope', 'email_exists').code).toBe('email_exists');
  });

  it('GeocodeUnavailableError carries the rider-facing message', () => {
    expect(new GeocodeUnavailableError().message).toBe(ERROR_MESSAGES.ADDRESS_LOOKUP_UNAVAILABLE);
  });

  it('errorMessage falls back when the error has no message', () => {
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(errorMessage('not an error', 'fallback')).toBe('fallback');
    expect(errorMessage(new Error(''), 'fallback')).toBe('fallback');
  });

  it('toLocationError maps web codes and plugin messages', () => {
    expect(toLocationError({ code: 1 }).reason).toBe('permission-denied');
    expect(toLocationError({ code: 3 }).reason).toBe('timeout');
    expect(toLocationError({ code: 2 }).reason).toBe('unavailable');
    expect(toLocationError({ message: 'User denied location' }).reason).toBe('permission-denied');
    expect(toLocationError({ message: 'Request timed out' }).reason).toBe('timeout');
    expect(toLocationError(null).message).toBe(LOCATION_MESSAGES.unavailable);
    const existing = new LocationError('timeout');
    expect(toLocationError(existing)).toBe(existing);
  });
});
