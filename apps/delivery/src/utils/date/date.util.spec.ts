import { toIsoDate } from '@utils/date/date.util';

describe('toIsoDate', () => {
  it('formats an ion-datetime value as yyyy-MM-dd', () => {
    expect(toIsoDate('2024-05-03T10:20:00')).toBe('2024-05-03');
  });

  it('keeps empty input empty', () => {
    expect(toIsoDate(null)).toBe('');
    expect(toIsoDate(undefined)).toBe('');
    expect(toIsoDate('')).toBe('');
  });
});
