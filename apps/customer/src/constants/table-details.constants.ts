import { SegmentOption } from '@appTypes/ui.types';
import { TableBookingForm } from '@appTypes/table.types';

export type TableDetailsSegment = 'booking' | 'review';

/** Bookable half-hour slots from 00:00 to 23:00. */
export const TIME_SLOTS = {
  START_HOUR: 0,
  END_HOUR: 23,
  STEP_MINUTES: 30,
  PAD_LENGTH: 2,
  PAD_CHAR: '0',
} as const;

/** Table detail / booking screen. */
export const TABLE_DETAILS_PAGE: {
  readonly SEGMENTS: readonly SegmentOption<TableDetailsSegment>[];
  readonly DEFAULT_SEGMENT: TableDetailsSegment;
  readonly EMPTY_BOOKING: TableBookingForm;
  readonly DATE_KEY_LENGTH: number;
} = {
  SEGMENTS: [
    { value: 'booking', label: 'Book' },
    { value: 'review', label: 'Review' },
  ],
  DEFAULT_SEGMENT: 'booking',
  EMPTY_BOOKING: { guests: 0, date: '', time: '', firstName: '', lastName: '', email: '', notes: '' },
  /** `YYYY-MM-DD` prefix of an ion-datetime ISO value. */
  DATE_KEY_LENGTH: 10,
};
