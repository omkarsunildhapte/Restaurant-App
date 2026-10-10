import { unwrap } from '@utils/supabase-result/supabase-result.util';
import { ERROR_MESSAGES } from '@constants/messages.constants';

describe('unwrap', () => {
  it('returns the data', () => {
    expect(unwrap({ data: [1, 2], error: null })).toEqual([1, 2]);
    expect(unwrap({ data: null, error: null })).toBeNull();
  });

  it("throws the server's message", () => {
    expect(() => unwrap({ data: null, error: { message: 'Wrong OTP' } })).toThrowError('Wrong OTP');
  });

  it('throws a readable message when the error has none (network)', () => {
    expect(() => unwrap({ data: null, error: { message: '' } })).toThrowError(ERROR_MESSAGES.DATA_FAILED);
  });
});
