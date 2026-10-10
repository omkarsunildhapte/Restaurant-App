import { SegmentOption } from '@appTypes/ui.types';

export type FoodReviewSegment = 'delivery' | 'review';

/** Food detail screen. */
export const FOOD_REVIEW_PAGE: { readonly SEGMENTS: readonly SegmentOption<FoodReviewSegment>[]; readonly DEFAULT_SEGMENT: FoodReviewSegment; readonly RATING: string; readonly START_QUANTITY: number } = {
  SEGMENTS: [
    { value: 'delivery', label: 'Delivery' },
    { value: 'review', label: 'Review' },
  ],
  DEFAULT_SEGMENT: 'delivery',
  RATING: '4.5',
  START_QUANTITY: 1,
};
