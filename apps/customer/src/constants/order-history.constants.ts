import { HistoryCard, SegmentOption } from '@appTypes/ui.types';

export type HistorySegment = 'table' | 'order';

/** Order-history screen (placeholder cards until order history is wired). */
export const ORDER_HISTORY_PAGE: {
  readonly SEGMENTS: readonly SegmentOption<HistorySegment>[];
  readonly DEFAULT_SEGMENT: HistorySegment;
  readonly TABLE_IMAGE: string;
  readonly ORDERS: readonly HistoryCard[];
} = {
  SEGMENTS: [
    { value: 'table', label: 'Table' },
    { value: 'order', label: 'Order' },
  ],
  DEFAULT_SEGMENT: 'order',
  TABLE_IMAGE: 'icon/burger.svg',
  ORDERS: [{ id: 'placeholder-1', date: 'Tuesday, 03 March 2023', restaurant: 'Starbucks', address: '8700 Beverly, CA 90048', amount: 8700, itemCount: 2, image: 'icon/burger.svg' }],
};
