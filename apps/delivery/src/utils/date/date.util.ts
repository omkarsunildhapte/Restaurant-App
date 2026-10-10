import { formatDate } from '@angular/common';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';

/** Formats an ion-datetime value (ISO string) as yyyy-MM-dd; empty input stays empty. */
export function toIsoDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return formatDate(value, PERSONAL_INFORMATION_PAGE.DATE_FORMAT, PERSONAL_INFORMATION_PAGE.DATE_LOCALE);
}
