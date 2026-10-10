import { EscPos, ascii, columnsFor, kotBytes, pairLines, receiptBytes, wrap, type ReceiptDoc } from './escpos';

const text = (b: Uint8Array) => String.fromCharCode(...b);
const has = (b: Uint8Array, seq: number[]) => text(b).includes(String.fromCharCode(...seq));

describe('ascii', () => {
  it('spells out symbols the printer code page lacks', () => {
    expect(ascii('₹180 × 2 − Café · “Spl”')).toBe("Rs 180 x 2 - Cafe - \"Spl\"");
  });

  it('replaces anything else with ?', () => {
    expect(ascii('चाय')).toBe('???');
  });
});

describe('layout helpers', () => {
  it('uses 32 columns on 58 mm and 48 on 80 mm', () => {
    expect(columnsFor(58)).toBe(32);
    expect(columnsFor(80)).toBe(48);
  });

  it('wraps words and cuts very long ones', () => {
    expect(wrap('Masala chai with extra ginger', 12)).toEqual(['Masala chai', 'with extra', 'ginger']);
    expect(wrap('Supercalifragilistic', 8)).toEqual(['Supercal', 'ifragili', 'stic']);
  });

  it('puts the amount on the right edge, wrapping the name if needed', () => {
    expect(pairLines('Tea', '20.00', 16)).toEqual(['Tea        20.00']);
    const lines = pairLines('Paneer tikka sandwich', '220.00', 20);
    expect(lines.at(-1)!.endsWith('220.00')).toBe(true);
    expect(lines.every((l) => l.length <= 20)).toBe(true);
  });
});

describe('EscPos commands', () => {
  it('starts with a reset and encodes the standard commands', () => {
    const b = new EscPos(32).align('center').bold(true).big(true).cut().drawer().bytes();
    expect([...b.slice(0, 2)]).toEqual([0x1b, 0x40]);
    expect(has(b, [0x1b, 0x61, 1])).toBe(true);
    expect(has(b, [0x1b, 0x45, 1])).toBe(true);
    expect(has(b, [0x1d, 0x21, 0x11])).toBe(true);
    expect(has(b, [0x1d, 0x56, 66, 3])).toBe(true);
    expect(has(b, [0x1b, 0x70, 0, 25, 250])).toBe(true);
  });
});

describe('receipt and KOT', () => {
  const doc: ReceiptDoc = {
    business: 'Brew & Leaf Café',
    outletLines: ['Baner', 'GSTIN 27AABFB1234C1Z5'],
    title: 'Tax invoice 2026-27/00042',
    when: '10/10/2026, 1:05 pm',
    orderLine: 'Order #17 - Table T4',
    customer: 'Meera',
    customerPhone: '+91 90000 00001',
    items: [{ label: '2 x Cappuccino', addons: 'Oat milk', amount: 400 }],
    subtotal: 400, discount: 0, cgst: 10, sgst: 10, roundOff: 0, total: 420,
    payments: [{ method: 'cash', amount: 420 }],
    openDrawer: true,
  };

  it('prints the invoice, totals and payments, then cuts and opens the drawer', () => {
    const b = receiptBytes(doc, 58);
    const t = text(b);
    expect(t).toContain('Tax invoice 2026-27/00042');
    expect(t).toContain('Brew & Leaf Cafe');
    expect(t).toContain('+ Oat milk');
    expect(t).toMatch(/TOTAL Rs +420\.00/);
    expect(t).toMatch(/Paid - CASH +420\.00/);
    expect(t).toContain('Ph +91 90000 00001');
    expect(t).not.toContain('Round-off');
    // every printed line fits the paper
    for (const l of t.replace(/[\x00-\x09\x0b-\x1f]/g, '').split('\n')) expect(ascii(l).length).toBeLessThanOrEqual(64);
    expect(t.indexOf(String.fromCharCode(0x1b, 0x70))).toBeGreaterThan(t.indexOf(String.fromCharCode(0x1d, 0x56)));
  });

  it('prints the round-off with its sign', () => {
    expect(text(receiptBytes({ ...doc, roundOff: 0.4, total: 420 }, 80))).toMatch(/Round-off +\+0\.40/);
    expect(text(receiptBytes({ ...doc, roundOff: -0.45, total: 420 }, 80))).toMatch(/Round-off +-0\.45/);
  });

  it('does not open the drawer for a card or UPI receipt', () => {
    expect(has(receiptBytes({ ...doc, openDrawer: false }, 80), [0x1b, 0x70])).toBe(false);
  });

  it('prints KOT quantities, add-ons and notes', () => {
    const t = text(kotBytes({ heading: 'KOT - Table T4', subLine: 'Order #17 - Round 2', items: [{ quantity: 2, label: 'Cappuccino', addons: 'Oat milk', notes: 'Less sugar' }] }, 80));
    expect(t).toContain('2 x Cappuccino');
    expect(t).toContain('** Less sugar');
    expect(t).toContain('Round 2');
  });
});

describe('Google review QR on receipts', () => {
  const base: ReceiptDoc = {
    business: 'Brew', outletLines: [], title: 'Tax invoice', when: 'now', orderLine: 'Order #1', customer: null, customerPhone: null,
    items: [{ label: '1 x Tea', addons: null, amount: 100 }], subtotal: 100, discount: 0, cgst: 2.5, sgst: 2.5, roundOff: 0, total: 105,
    payments: [{ method: 'upi', amount: 105 }], openDrawer: false,
  };
  const url = 'https://search.google.com/local/writereview?placeid=ChIJ_test_place_1';
  const find = (b: Uint8Array, seq: number[]) => Array.from(b).findIndex((_, i) => seq.every((x, j) => b[i + j] === x));

  it('stores the link and prints it with the QR command', () => {
    const b = receiptBytes({ ...base, reviewUrl: url }, 80);
    const store = find(b, [0x1d, 0x28, 0x6b, (url.length + 3) & 0xff, (url.length + 3) >> 8, 0x31, 0x50, 0x30]);
    expect(store).toBeGreaterThan(0);
    expect(new TextDecoder().decode(b.slice(store + 8, store + 8 + url.length))).toBe(url);
    expect(find(b, [0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x51, 0x30])).toBeGreaterThan(store);
    expect(new TextDecoder().decode(b)).toContain('Review us on Google');
  });

  it('uses a smaller QR on 58 mm paper', () => {
    expect(find(receiptBytes({ ...base, reviewUrl: url }, 58), [0x1d, 0x28, 0x6b, 3, 0, 0x31, 0x43, 4])).toBeGreaterThan(0);
  });

  it('prints no QR without a link', () => {
    expect(find(receiptBytes(base, 80), [0x1d, 0x28, 0x6b])).toBe(-1);
  });
});
