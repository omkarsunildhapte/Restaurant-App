import { distanceMeters } from '@utils/geo/geo.util';

describe('distanceMeters', () => {
  it('is 0 for the same point', () => {
    expect(distanceMeters({ lat: 18.56, lng: 73.77 }, { lat: 18.56, lng: 73.77 })).toBe(0);
  });

  it('measures short city distances', () => {
    // 0.0001 degree of latitude is about 11 m
    expect(distanceMeters({ lat: 18.56, lng: 73.77 }, { lat: 18.5601, lng: 73.77 })).toBeCloseTo(11.1, 0);
    // Baner to Balewadi High Street, about 1.4 km
    const d = distanceMeters({ lat: 18.559, lng: 73.7867 }, { lat: 18.57, lng: 73.776 });
    expect(d).toBeGreaterThan(1400);
    expect(d).toBeLessThan(1700);
  });
});
