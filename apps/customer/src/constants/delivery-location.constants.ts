import { AddressForm } from '@appTypes/geocode.types';
import { GEOCODE } from '@constants/geocode.constants';

/** Delivery-location screen. */
export const DELIVERY_LOCATION_PAGE: {
  readonly EMPTY_ADDRESS: AddressForm;
  readonly LOOKUP_UNAVAILABLE_TYPE_INSTEAD: string;
  readonly LOOKUP_UNAVAILABLE_TYPE_BELOW: string;
  readonly NO_MATCH: string;
  readonly NO_ADDRESS_FOR_POSITION: string;
  readonly ADDRESS_FIELDS: readonly { key: Exclude<keyof AddressForm, 'line'>; label: string; autocomplete: string }[];
} = {
  EMPTY_ADDRESS: { line: '', road: '', suburb: '', city: '', state: '', postcode: '', country: '' },
  LOOKUP_UNAVAILABLE_TYPE_INSTEAD: `${GEOCODE.UNAVAILABLE}. Type your address instead.`,
  LOOKUP_UNAVAILABLE_TYPE_BELOW: `${GEOCODE.UNAVAILABLE}. Type your address below.`,
  NO_MATCH: 'No matching address found. You can type it below.',
  NO_ADDRESS_FOR_POSITION: 'No address found for your location. Type your address instead.',
  ADDRESS_FIELDS: [
    { key: 'road', label: 'Street', autocomplete: 'address-line1' },
    { key: 'suburb', label: 'Area', autocomplete: 'address-line2' },
    { key: 'city', label: 'City', autocomplete: 'address-level2' },
    { key: 'state', label: 'State', autocomplete: 'address-level1' },
    { key: 'postcode', label: 'Postcode', autocomplete: 'postal-code' },
    { key: 'country', label: 'Country', autocomplete: 'country-name' },
  ],
};
