/**
 * ESC/POS for 58 and 80 mm thermal printers: a small command builder and the receipt and KOT
 * layouts. Pure (no browser APIs), so the exact bytes are unit-tested in escpos.spec.ts.
 *
 * Text is sent in the printer's default code page (PC437), so it is reduced to plain ASCII:
 * ₹ prints as "Rs", × as "x", accents are dropped. Font A gives 32 columns on 58 mm paper and
 * 48 on 80 mm.
 */

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type Align = 'left' | 'center' | 'right';

export const columnsFor = (paperMm: 58 | 80): number => (paperMm === 58 ? 32 : 48);

/** Plain ASCII for the printer: rupee, multiply and dash signs spelled out, accents dropped. */
export function ascii(s: string): string {
  return s
    .replace(/₹\s?/g, 'Rs ')
    .replace(/[×✕]/g, 'x')
    .replace(/[−–—]/g, '-')
    .replace(/·/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e\n]/g, '?');
}

/** Word-wraps to `width` columns; words longer than a line are cut. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of ascii(text).split('\n')) {
    let line = '';
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (word.length > width) {
        if (line) {
          out.push(line);
          line = '';
        }
        out.push(word.slice(0, width));
        word = word.slice(width);
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= width) line += ' ' + word;
      else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

/** Left text and right text on one line; the left side wraps if they don't fit. */
export function pairLines(left: string, right: string, width: number): string[] {
  const r = ascii(right);
  const room = Math.max(1, width - r.length - 1);
  const lines = wrap(left, room);
  const last = lines.pop() ?? '';
  return [...lines, last + ' '.repeat(Math.max(1, width - last.length - r.length)) + r];
}

export class EscPos {
  private readonly out: number[] = [];

  constructor(readonly columns: number) {
    this.raw(ESC, 0x40); // ESC @: reset
  }

  public raw(...bytes: number[]): this {
    this.out.push(...bytes);
    return this;
  }

  public align(a: Align): this {
    return this.raw(ESC, 0x61, a === 'left' ? 0 : a === 'center' ? 1 : 2);
  }

  public bold(on: boolean): this {
    return this.raw(ESC, 0x45, on ? 1 : 0);
  }

  /** Double width and height (half the columns while on). */
  public big(on: boolean): this {
    return this.raw(GS, 0x21, on ? 0x11 : 0x00);
  }

  public text(s: string): this {
    for (const ch of ascii(s)) this.out.push(ch.charCodeAt(0));
    return this;
  }

  public line(s = ''): this {
    return this.text(s).raw(LF);
  }

  /** Wrapped paragraph at the current width (`cols` when printing big). */
  public para(s: string, cols = this.columns): this {
    for (const l of wrap(s, cols)) this.line(l);
    return this;
  }

  public pair(left: string, right: string): this {
    for (const l of pairLines(left, right, this.columns)) this.line(l);
    return this;
  }

  public rule(ch = '-'): this {
    return this.line(ch.repeat(this.columns));
  }

  public feed(lines: number): this {
    return this.raw(ESC, 0x64, Math.max(0, Math.min(255, lines)));
  }

  /** Feeds past the cutter and cuts (partial cut; printers without a cutter ignore it). */
  public cut(): this {
    return this.raw(GS, 0x56, 66, 3);
  }

  /** Kicks the cash drawer on pin 2: ESC p 0 25 250 (50 ms on, 500 ms off). */
  public drawer(): this {
    return this.raw(ESC, 0x70, 0, 25, 250);
  }

  public bytes(): Uint8Array {
    return Uint8Array.from(this.out);
  }
}

const amount = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const rs = (n: number): string => amount.format(Number(n ?? 0));

export interface ReceiptDoc {
  business: string;
  outletLines: string[];
  title: string;
  when: string;
  orderLine: string;
  customer: string | null;
  customerPhone: string | null;
  items: { label: string; addons: string | null; amount: number }[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  /** Rounding to the rupee, + or − (0 = none). */
  roundOff: number;
  total: number;
  payments: { method: string; amount: number }[];
  openDrawer: boolean;
}

export function receiptBytes(d: ReceiptDoc, paperMm: 58 | 80): Uint8Array {
  const p = new EscPos(columnsFor(paperMm));
  p.align('center').bold(true).big(true).para(d.business, Math.floor(p.columns / 2)).big(false).bold(false);
  for (const l of d.outletLines) p.para(l);
  p.bold(true).para(d.title).bold(false).align('left');
  p.line(d.when).para(d.orderLine);
  if (d.customer) p.para(d.customer);
  if (d.customerPhone) p.para('Ph ' + d.customerPhone);
  p.rule();
  for (const i of d.items) {
    p.pair(i.label, rs(i.amount));
    if (i.addons) p.para('  + ' + i.addons);
  }
  p.rule();
  p.pair('Subtotal', rs(d.subtotal));
  if (d.discount) p.pair('Discount', '-' + rs(d.discount));
  p.pair('CGST', rs(d.cgst)).pair('SGST', rs(d.sgst));
  if (d.roundOff) p.pair('Round-off', (d.roundOff > 0 ? '+' : '-') + rs(Math.abs(d.roundOff)));
  p.bold(true).pair('TOTAL Rs', rs(d.total)).bold(false);
  for (const pay of d.payments) p.pair('Paid - ' + pay.method.toUpperCase(), rs(pay.amount));
  p.align('center').line().line('Thank you! Visit again.').align('left').feed(3).cut();
  if (d.openDrawer) p.drawer();
  return p.bytes();
}

export interface KotDoc {
  heading: string;
  subLine: string;
  items: { quantity: number; label: string; addons: string | null; notes: string | null }[];
}

/** Kitchen ticket: big heading and quantities, notes in bold so the cook sees them. */
export function kotBytes(d: KotDoc, paperMm: 58 | 80): Uint8Array {
  const p = new EscPos(columnsFor(paperMm));
  const half = Math.floor(p.columns / 2);
  p.align('center').bold(true).big(true).para(d.heading, half).big(false).bold(false).para(d.subLine).align('left').rule('=');
  for (const i of d.items) {
    p.bold(true).big(true).para(`${i.quantity} x ${i.label}`, half).big(false).bold(false);
    if (i.addons) p.para('  + ' + i.addons);
    if (i.notes) p.bold(true).para('  ** ' + i.notes).bold(false);
    p.rule();
  }
  p.feed(3).cut();
  return p.bytes();
}
