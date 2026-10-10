import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetGeocodeState, reverse, search } from '@service/geocode/geocode.service.js';

const place = {
  place_id: 123456,
  display_name: 'MG Road, Pune, Maharashtra, 411001, India',
  lat: '18.5167',
  lon: '73.8786',
  address: { road: 'MG Road', town: 'Pune', state: 'Maharashtra', postcode: '411001', country: 'India' },
};

describe('nominatim client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetGeocodeState();
    fetchMock = vi.fn(async () => new Response(JSON.stringify([place]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalises results and sends an identifying User-Agent', async () => {
    const [r] = await search('MG Road Pune');
    expect(r).toEqual({
      placeId: 123456,
      displayName: place.display_name,
      lat: 18.5167,
      lng: 73.8786,
      address: { road: 'MG Road', suburb: undefined, city: 'Pune', state: 'Maharashtra', postcode: '411001', country: 'India' },
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/search?');
    expect(String(url)).toContain('countrycodes=in');
    expect(init.headers['User-Agent']).toMatch(/Thaliyo/);
  });

  it('caches repeated and concurrent queries (case and spacing insensitive)', async () => {
    await Promise.all([search('MG Road Pune'), search('mg  road pune')]);
    await search('MG ROAD PUNE');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('spaces upstream requests at least 1 second apart', async () => {
    const started = Date.now();
    await Promise.all([search('first place'), search('second place')]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Date.now() - started).toBeGreaterThanOrEqual(1000);
  });

  it('reverse returns null where Nominatim finds no address', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unable to geocode' }), { status: 200 }));
    expect(await reverse(0, 0)).toBeNull();
  });

  it('turns an upstream failure into a 502', async () => {
    fetchMock.mockResolvedValueOnce(new Response('busy', { status: 429 }));
    await expect(search('rate limited place')).rejects.toMatchObject({ statusCode: 502, errorCode: 'UPSTREAM_ERROR' });
  });
});
