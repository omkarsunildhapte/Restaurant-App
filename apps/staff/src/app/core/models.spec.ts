import { round2 } from './models';

describe('round2', () => {
  it('rounds half away from zero like Postgres, without float noise', () => {
    expect(round2(5.005)).toBe(5.01);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(10.004)).toBe(10);
    expect(round2(-5.005)).toBe(-5.01);
  });
});
