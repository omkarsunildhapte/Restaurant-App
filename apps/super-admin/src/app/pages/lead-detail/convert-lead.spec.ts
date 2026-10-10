import { slugify } from './convert-lead';

// The platform API accepts slugs matching this; anything slugify returns must pass it.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('slugify', () => {
  it('turns a restaurant name and area into a web-address name', () => {
    expect(slugify('Pilot Test Cafe Aundh')).toBe('pilot-test-cafe-aundh');
  });

  it('spells out "&" and drops accents and punctuation', () => {
    expect(slugify("Bean & Brew Café, Baner!")).toBe('bean-and-brew-cafe-baner');
  });

  it('never starts or ends with a dash, and collapses repeats', () => {
    expect(slugify('  --The   Daily -- Brew--  ')).toBe('the-daily-brew');
  });

  it('caps the length without leaving a trailing dash', () => {
    const slug = slugify('a'.repeat(59) + ' bistro');
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug).toMatch(SLUG);
  });

  it('always produces something the API accepts for ordinary names', () => {
    for (const name of ["Kalika Family Restaurant", "Baker's Basket", 'Momo Junction 2.0', 'चाय Corner']) {
      expect(slugify(name)).toMatch(SLUG);
    }
  });
});
