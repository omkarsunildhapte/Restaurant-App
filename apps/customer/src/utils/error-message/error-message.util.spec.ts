import { ERROR_MESSAGES } from '@constants/messages.constants';
import { errorCode, errorMessage } from '@utils/error-message/error-message.util';

describe('errorMessage / errorCode', () => {
  it('reads messages from errors, objects and strings', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
    expect(errorMessage({ message: 'Invalid login credentials' })).toBe('Invalid login credentials');
    expect(errorMessage('plain')).toBe('plain');
  });

  it('falls back for anything else', () => {
    expect(errorMessage(null)).toBe(ERROR_MESSAGES.GENERIC);
    expect(errorMessage({ message: 42 }, 'fallback')).toBe('fallback');
  });

  it('reads string error codes only', () => {
    expect(errorCode({ code: 'user_already_exists' })).toBe('user_already_exists');
    expect(errorCode({ code: 400 })).toBeUndefined();
    expect(errorCode(undefined)).toBeUndefined();
  });
});
