import { TIME_SLOTS } from '@constants/table-details.constants';

const pad = (n: number): string => String(n).padStart(TIME_SLOTS.PAD_LENGTH, TIME_SLOTS.PAD_CHAR);

/** `YYYY-MM-DD` for a local date. */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Bookable slots (`HH:mm`, every TIME_SLOTS.STEP_MINUTES) from START_HOUR to END_HOUR:00 on a
 * local `YYYY-MM-DD` date. For today, only slots that haven't started yet.
 */
export function timeSlots(selectedDate: string, now: Date = new Date()): string[] {
  const [y, m, d] = selectedDate.split('-').map(Number);
  if (!y || !m || !d) return [];
  // Parse as a LOCAL date (new Date('YYYY-MM-DD') would be UTC).
  const slot = new Date(y, m - 1, d, TIME_SLOTS.START_HOUR, 0, 0, 0);
  if (selectedDate === localDateKey(now)) {
    while (slot < now) slot.setMinutes(slot.getMinutes() + TIME_SLOTS.STEP_MINUTES);
  }
  const slots: string[] = [];
  while (slot.getDate() === d && (slot.getHours() < TIME_SLOTS.END_HOUR || (slot.getHours() === TIME_SLOTS.END_HOUR && slot.getMinutes() === 0))) {
    slots.push(`${pad(slot.getHours())}:${pad(slot.getMinutes())}`);
    slot.setMinutes(slot.getMinutes() + TIME_SLOTS.STEP_MINUTES);
  }
  return slots;
}
