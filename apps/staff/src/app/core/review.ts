import type { Outlet } from '@app/core/models';

/** Google's "Write a review" page for a place (the Place ID comes from the Business panel). */
export const GOOGLE_REVIEW_URL = 'https://search.google.com/local/writereview?placeid=';
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

/** The review link to print on this outlet's bills, or null when it has none or it's turned off. */
export function reviewUrlFor(outlet: Pick<Outlet, 'google_place_id' | 'review_qr_on_bill'> | null): string | null {
  const id = outlet?.google_place_id?.trim();
  if (!id || outlet?.review_qr_on_bill === false || !PLACE_ID.test(id)) return null;
  return GOOGLE_REVIEW_URL + encodeURIComponent(id);
}

/**
 * The QR as an SVG tag for receipts printed through the print dialog. The QR library is loaded
 * only here, the first time a bill with a review link is printed, so it isn't in the startup bundle.
 */
export async function qrSvg(text: string, cellSize = 3): Promise<string> {
  const qrcode = (await import('qrcode-generator')).default;
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize, margin: 0, scalable: false });
}
