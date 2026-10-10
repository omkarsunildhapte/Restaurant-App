import { billAmounts, lineAmounts, percentDiscount, splitEqually } from './billing';

describe('lineAmounts', () => {
  it('adds GST on top when prices exclude tax', () => {
    expect(lineAmounts({ unitPrice: 180, quantity: 2, taxRate: 5 }, false)).toEqual({ subtotal: 360, tax: 18, total: 378 });
  });

  it('takes GST out of the price when prices include tax', () => {
    // 210 incl. 5% → 200 + 10
    expect(lineAmounts({ unitPrice: 210, quantity: 1, taxRate: 5 }, true)).toEqual({ subtotal: 200, tax: 10, total: 210 });
  });

  it('rounds to the paisa like the database', () => {
    // 3 × 99.99 = 299.97, 18% = 53.9946 → 53.99
    expect(lineAmounts({ unitPrice: 99.99, quantity: 3, taxRate: 18 }, false)).toEqual({ subtotal: 299.97, tax: 53.99, total: 353.96 });
  });

  it('handles 0% items', () => {
    expect(lineAmounts({ unitPrice: 50, quantity: 2, taxRate: 0 }, false)).toEqual({ subtotal: 100, tax: 0, total: 100 });
  });
});

describe('billAmounts', () => {
  const lines = [lineAmounts({ unitPrice: 180, quantity: 2, taxRate: 5 }, false), lineAmounts({ unitPrice: 320, quantity: 1, taxRate: 5 }, false)];

  it('matches the pgTAP case: 680 + 5% = 714', () => {
    expect(billAmounts(lines, 0)).toEqual({ subtotal: 680, discount: 0, taxable: 680, cgst: 17, sgst: 17, roundOff: 0, total: 714 });
  });

  it('reduces GST in proportion to the discount', () => {
    // 680 - 68 = 612; tax 34 × 612/680 = 30.6; CGST 15.3 + SGST 15.3
    expect(billAmounts(lines, 68)).toEqual({ subtotal: 680, discount: 68, taxable: 612, cgst: 15.3, sgst: 15.3, roundOff: 0, total: 642.6 });
  });

  it('gives SGST the odd paisa so CGST + SGST = tax', () => {
    const b = billAmounts([lineAmounts({ unitPrice: 100.1, quantity: 1, taxRate: 5 }, false)], 0);
    expect(b.cgst + b.sgst).toBeCloseTo(5.01, 2);
    expect(b.total).toBe(105.11);
  });

  it('never discounts below zero or more than the bill', () => {
    expect(billAmounts(lines, -5).discount).toBe(0);
    expect(billAmounts(lines, 9999).total).toBe(0);
  });

  it('is zero for an empty order', () => {
    expect(billAmounts([], 0).total).toBe(0);
  });
});

describe('splitEqually', () => {
  it('splits so the parts add up to the total exactly', () => {
    const parts = splitEqually(714, 3);
    expect(parts).toEqual([238, 238, 238]);
    const odd = splitEqually(100, 3);
    expect(odd).toEqual([33.33, 33.33, 33.34]);
    expect(Math.round(odd.reduce((a, b) => a + b, 0) * 100) / 100).toBe(100);
  });

  it('treats fewer than one part as one', () => {
    expect(splitEqually(50, 0)).toEqual([50]);
  });
});

describe('percentDiscount', () => {
  it('is a percentage of the pre-tax subtotal, capped at 100%', () => {
    expect(percentDiscount(680, 10)).toBe(68);
    expect(percentDiscount(680, 150)).toBe(680);
  });
});

describe('item-wise split bills', () => {
  const coffee = { unitPrice: 180, quantity: 1, taxRate: 5 };
  const sandwich = { unitPrice: 220, quantity: 1, taxRate: 5 };
  const brownie = { unitPrice: 140, quantity: 1, taxRate: 18 };

  it('bills for each guest add up to the whole order without a discount', () => {
    const whole = billAmounts([coffee, coffee, sandwich, brownie].map((l) => lineAmounts(l, false)), 0);
    const guest1 = billAmounts([coffee, sandwich].map((l) => lineAmounts(l, false)), 0);
    const guest2 = billAmounts([coffee, brownie].map((l) => lineAmounts(l, false)), 0);
    expect(guest1.total + guest2.total).toBeCloseTo(whole.total, 2);
    expect(guest1).toEqual({ subtotal: 400, discount: 0, taxable: 400, cgst: 10, sgst: 10, roundOff: 0, total: 420 });
  });

  it('a discount on one guest bill only scales that bill’s tax', () => {
    // 400 + 5% (20), ₹40 off → taxable 360, tax 18 → 378
    expect(billAmounts([coffee, sandwich].map((l) => lineAmounts(l, false)), 40)).toEqual({
      subtotal: 400, discount: 40, taxable: 360, cgst: 9, sgst: 9, roundOff: 0, total: 378,
    });
  });

  it('splitting a line of 2 into 1 + 1 keeps the amounts when prices exclude tax', () => {
    const two = lineAmounts({ ...coffee, quantity: 2 }, false);
    const one = lineAmounts(coffee, false);
    expect(one.total * 2).toBe(two.total);
  });
});

describe('round-off (supabase 0011)', () => {
  const lines = [lineAmounts({ unitPrice: 190, quantity: 1, taxRate: 5 }, false), lineAmounts({ unitPrice: 320, quantity: 1, taxRate: 5 }, false)];

  it('matches the pgTAP case: 535.50 rounds up to 536 (+0.50), GST unchanged', () => {
    expect(billAmounts(lines, 0, true)).toEqual({ subtotal: 510, discount: 0, taxable: 510, cgst: 12.75, sgst: 12.75, roundOff: 0.5, total: 536 });
  });

  it('rounds down below half a rupee', () => {
    // 199.50 exactly half → up; 210.30 → 210 (-0.30)
    expect(billAmounts([lineAmounts({ unitPrice: 190, quantity: 1, taxRate: 5 }, false)], 0, true).total).toBe(200);
    const b = billAmounts([lineAmounts({ unitPrice: 200.29, quantity: 1, taxRate: 5 }, false)], 0, true);
    expect(b.total).toBe(210);
    expect(b.roundOff).toBe(-0.3);
  });

  it('is off unless the business turns it on', () => {
    expect(billAmounts(lines, 0).total).toBe(535.5);
  });
});
