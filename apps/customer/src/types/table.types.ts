import { Entity } from '@appTypes/common.types';

/** An image shown in a table's carousel. */
export interface TableImage {
  url: string;
}

/** A bookable dining table. */
export interface DiningTable extends Entity {
  itemName: string;
  description: string;
  price: number;
  availability: string;
  bannerImages: TableImage[];
}

/** The booking form's values. */
export interface TableBookingForm {
  guests: number;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  notes: string;
}

/** A submitted booking. */
export interface TableBooking extends TableBookingForm {
  id?: string;
  tableId: string;
  userId: string;
}
