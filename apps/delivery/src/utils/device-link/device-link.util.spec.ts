import { mapLink, telLink } from '@utils/device-link/device-link.util';

describe('device links', () => {
  it('builds a geo: link for the maps app', () => {
    expect(mapLink({ lat: 18.559, lng: 73.7867 })).toBe('geo:18.559,73.7867?q=18.559,73.7867');
    expect(mapLink(null)).toBeNull();
  });

  it('builds a tel: link from a formatted number', () => {
    expect(telLink('+91 90000-00001')).toBe('tel:+919000000001');
    expect(telLink(null)).toBeNull();
    expect(telLink('  ')).toBeNull();
  });
});
