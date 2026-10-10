import { lastFour } from '@utils/mask/mask.util';

describe('lastFour', () => {
  it('keeps only the last 4 characters, ignoring spaces', () => {
    expect(lastFour('1234 5678 9012')).toBe('9012');
    expect(lastFour('AB12')).toBe('AB12');
  });

  it('is null for nothing saved', () => {
    expect(lastFour(null)).toBeNull();
    expect(lastFour('  ')).toBeNull();
  });
});
