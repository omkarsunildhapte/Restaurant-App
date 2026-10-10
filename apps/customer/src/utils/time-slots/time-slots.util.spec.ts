import { localDateKey, timeSlots } from '@utils/time-slots/time-slots.util';

describe('timeSlots', () => {
  it('lists half-hour slots from 00:00 to 23:00 for a future day', () => {
    const slots = timeSlots('2030-05-01', new Date(2026, 0, 1, 12, 0));
    expect(slots[0]).toBe('00:00');
    expect(slots[1]).toBe('00:30');
    expect(slots.at(-1)).toBe('23:00');
    expect(slots).toHaveLength(47);
  });

  it('skips slots that already started today', () => {
    const now = new Date(2026, 9, 10, 14, 10);
    const slots = timeSlots(localDateKey(now), now);
    expect(slots[0]).toBe('14:30');
    expect(slots.at(-1)).toBe('23:00');
  });

  it('returns nothing for an invalid date', () => {
    expect(timeSlots('')).toEqual([]);
  });

  it('formats a local date key', () => {
    expect(localDateKey(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});
