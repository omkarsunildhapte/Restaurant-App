import { describe, expect, it } from 'vitest';
import { GOOGLE_REVIEW_URL, qrSvg, reviewUrlFor } from '@app/core/review';

describe('reviewUrlFor', () => {
  it('builds the Google write-a-review link from the Place ID', () => {
    expect(reviewUrlFor({ google_place_id: ' ChIJN1t_tDeuEmsRUsoyG83frY4 ', review_qr_on_bill: true })).toBe(GOOGLE_REVIEW_URL + 'ChIJN1t_tDeuEmsRUsoyG83frY4');
  });

  it('is null when there is no Place ID, it is switched off, or it is not a Place ID', () => {
    expect(reviewUrlFor(null)).toBeNull();
    expect(reviewUrlFor({ google_place_id: null })).toBeNull();
    expect(reviewUrlFor({ google_place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4', review_qr_on_bill: false })).toBeNull();
    expect(reviewUrlFor({ google_place_id: 'https://evil.example/x?y' })).toBeNull();
  });
});

describe('qrSvg', () => {
  it('draws the link as an SVG QR code', async () => {
    const svg = await qrSvg(GOOGLE_REVIEW_URL + 'ChIJN1t_tDeuEmsRUsoyG83frY4');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<path');
  });
});
