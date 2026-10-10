import { DOCUMENT, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SessionStore } from '@app/core/session.store';
import { money, type Bill, type Kot, type Order, type OrderItem, type Payment } from '@app/core/models';
import { kotBytes, receiptBytes, type KotDoc, type ReceiptDoc } from '@app/core/escpos';
import { ThermalLink, thermalSupported, type ThermalMode } from '@app/core/thermal';

export type PaperWidth = 58 | 80;
/** 'driver': the browser's print dialog; 'usb' / 'serial': ESC/POS straight to the printer. */
export type PrintMode = 'driver' | ThermalMode;
const WIDTH_KEY = 'rp-staff.paper';
const MODE_KEY = 'rp-staff.printMode';
const DEVICE_KEY = 'rp-staff.printDevice';

/**
 * Prints GST receipts and kitchen tickets (KOT) on a thermal printer, in one of two ways
 * chosen per device:
 *
 * - **Print dialog** (default): through the printer's driver. Install the driver once (58 or
 *   80 mm), set it as the default printer and turn on "open cash drawer" in the driver if a
 *   drawer is connected; Chrome's kiosk printing (--kiosk-printing) then prints without the dialog.
 * - **Direct (ESC/POS)** over USB or serial/Bluetooth (see thermal.ts): no driver, no dialog,
 *   paper cut and cash drawer kick (on receipts with a cash payment) sent as printer commands.
 *   If a direct print fails, the same receipt goes to the print dialog instead.
 */
@Injectable({ providedIn: 'root' })
export class Printer {
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SessionStore);
  private readonly inBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _width = signal<PaperWidth>(this.readWidth());
  readonly width = this._width.asReadonly();

  private readonly link = new ThermalLink();
  private readonly _mode = signal<PrintMode>(this.read(MODE_KEY) === 'usb' ? 'usb' : this.read(MODE_KEY) === 'serial' ? 'serial' : 'driver');
  private readonly _device = signal<string | null>(this.read(DEVICE_KEY));
  private readonly _error = signal<string | null>(null);
  readonly mode = this._mode.asReadonly();
  /** Name of the paired direct printer, if any. */
  readonly device = this._device.asReadonly();
  /** Why the last direct print failed (it went to the print dialog instead). */
  readonly error = this._error.asReadonly();

  public supports(mode: ThermalMode): boolean {
    return this.inBrowser && thermalSupported(mode);
  }

  public useDriver(): void {
    this._mode.set('driver');
    this._error.set(null);
    this.write(MODE_KEY, 'driver');
  }

  /** Pairs a direct printer and switches to it. Must run from a click (browser rule). */
  public async pair(mode: ThermalMode): Promise<void> {
    this._error.set(null);
    try {
      const name = await this.link.pair(mode);
      this._mode.set(mode);
      this._device.set(name);
      this.write(MODE_KEY, mode);
      this.write(DEVICE_KEY, name);
    } catch (e) {
      // Closing the picker without choosing is not an error worth showing.
      if ((e as Error).name !== 'NotFoundError') this._error.set((e as Error).message);
    }
  }

  /** A short test slip on the direct printer. */
  public async testPrint(): Promise<void> {
    const mode = this._mode();
    if (mode === 'driver') return;
    const doc: KotDoc = { heading: 'Printer test', subLine: `${this._width()} mm - ${new Date().toLocaleString('en-IN')}`, items: [{ quantity: 1, label: 'Test line', addons: null, notes: 'Cut below' }] };
    this._error.set(null);
    try {
      await this.link.write(mode, kotBytes(doc, this._width()));
    } catch (e) {
      this._error.set((e as Error).message);
    }
  }

  public setWidth(width: PaperWidth): void {
    this._width.set(width);
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      /* not remembered */
    }
  }

  public receipt(order: Order, items: OrderItem[], bill: Bill | null, payments: Payment[], estimate: { subtotal: number; discount: number; tax: number; roundOff?: number; total: number }, tableName: string | null): void {
    const outlet = this.session.outlet();
    const ws = this.session.workspace();
    const title = bill ? `Tax invoice ${bill.invoice_no}` : 'Provisional bill (offline, number on sync)';
    const sub = bill?.subtotal ?? estimate.subtotal;
    const discount = bill?.discount ?? estimate.discount;
    const cgst = bill ? bill.cgst : estimate.tax / 2;
    const sgst = bill ? bill.sgst : estimate.tax / 2;
    const total = bill?.total ?? estimate.total;
    const roundOff = bill?.round_off ?? estimate.roundOff ?? 0;
    const when = new Date(bill?.paid_at ?? Date.now()).toLocaleString('en-IN');
    const where = order.type === 'dine_in' ? 'Table ' + (tableName ?? '') : order.type === 'takeaway' ? 'Takeaway' : 'Delivery';
    const doc: ReceiptDoc = {
      business: ws?.tenant_name ?? '',
      outletLines: [outlet?.name, outlet?.address, outlet?.phone ? 'Ph ' + outlet.phone : null, outlet?.gstin ? 'GSTIN ' + outlet.gstin : null].filter((l): l is string => !!l),
      title,
      when,
      orderLine: `Order #${order.order_no ?? '-'} - ${where}`,
      customer: order.customer_name,
      customerPhone: order.customer_phone,
      items: items.map((i) => ({ label: i.quantity + ' x ' + i.name + (i.variant_name ? ' (' + i.variant_name + ')' : ''), addons: i.addons.length ? i.addons.map((a) => a.name).join(', ') : null, amount: i.unit_price * i.quantity })),
      subtotal: sub,
      discount,
      cgst,
      sgst,
      roundOff,
      total,
      payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
      openDrawer: payments.some((p) => p.method === 'cash'),
    };
    const rows = items
      .map(
        (i) => `<tr><td>${esc(i.quantity + ' × ' + i.name + (i.variant_name ? ' (' + i.variant_name + ')' : ''))}${i.addons.length ? '<br><small>+ ' + esc(i.addons.map((a) => a.name).join(', ')) + '</small>' : ''}</td><td class="r">${money(i.unit_price * i.quantity)}</td></tr>`,
      )
      .join('');
    this.send(() => receiptBytes(doc, this._width()), `
      <h1>${esc(ws?.tenant_name ?? '')}</h1>
      <p class="c">${esc(outlet?.name ?? '')}${outlet?.address ? '<br>' + esc(outlet.address) : ''}${outlet?.phone ? '<br>Ph ' + esc(outlet.phone) : ''}${outlet?.gstin ? '<br>GSTIN ' + esc(outlet.gstin) : ''}</p>
      <p class="c b">${esc(title)}</p>
      <p>${esc(new Date(bill?.paid_at ?? Date.now()).toLocaleString('en-IN'))}<br>Order #${order.order_no ?? '—'} · ${esc(order.type === 'dine_in' ? 'Table ' + (tableName ?? '') : order.type === 'takeaway' ? 'Takeaway' : 'Delivery')}${order.customer_name ? '<br>' + esc(order.customer_name) : ''}${order.customer_phone ? '<br>Ph ' + esc(order.customer_phone) : ''}</p>
      <table>${rows}</table>
      <table class="t">
        <tr><td>Subtotal</td><td class="r">${money(sub)}</td></tr>
        ${discount ? `<tr><td>Discount</td><td class="r">−${money(discount)}</td></tr>` : ''}
        <tr><td>CGST</td><td class="r">${money(cgst)}</td></tr>
        <tr><td>SGST</td><td class="r">${money(sgst)}</td></tr>
        ${roundOff ? `<tr><td>Round-off</td><td class="r">${roundOff > 0 ? '+' : '−'}${money(Math.abs(roundOff))}</td></tr>` : ''}
        <tr class="b"><td>Total</td><td class="r">${money(total)}</td></tr>
        ${payments.map((p) => `<tr><td>Paid · ${esc(p.method.toUpperCase())}</td><td class="r">${money(p.amount)}</td></tr>`).join('')}
      </table>
      <p class="c">Thank you! Visit again.</p>
      <p class="c"><small>Billing by Thaliyo</small></p>`);
  }

  public kot(order: Order, kot: Pick<Kot, 'round_no'>, lines: OrderItem[], tableName: string | null): void {
    // Only dishes go to the kitchen: a line without a menu item is a charge such as packaging.
    const items = lines.filter((i) => i.item_id !== null);
    if (!items.length) return;
    const rows = items
      .map((i) => `<tr><td class="q">${i.quantity}</td><td>${esc(i.name + (i.variant_name ? ' (' + i.variant_name + ')' : ''))}${i.addons.length ? '<br><small>+ ' + esc(i.addons.map((a) => a.name).join(', ')) + '</small>' : ''}${i.notes ? '<br><b>' + esc(i.notes) + '</b>' : ''}</td></tr>`)
      .join('');
    const doc: KotDoc = {
      heading: 'KOT - ' + (order.type === 'dine_in' ? 'Table ' + (tableName ?? '') : order.type === 'takeaway' ? 'Takeaway' : 'Delivery'),
      subLine: `Order #${order.order_no ?? '-'} - Round ${kot.round_no} - ${new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`,
      items: items.map((i) => ({ quantity: i.quantity, label: i.name + (i.variant_name ? ' (' + i.variant_name + ')' : ''), addons: i.addons.length ? i.addons.map((a) => a.name).join(', ') : null, notes: i.notes })),
    };
    this.send(() => kotBytes(doc, this._width()), `
      <h1>KOT · ${esc(order.type === 'dine_in' ? 'Table ' + (tableName ?? '') : order.type === 'takeaway' ? 'Takeaway' : 'Delivery')}</h1>
      <p class="c">Order #${order.order_no ?? '—'} · Round ${kot.round_no} · ${esc(new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }))}</p>
      <table class="kot">${rows}</table>`);
  }

  /** Direct ESC/POS when a printer is paired, else (or if that fails) the print dialog. */
  private send(bytes: () => Uint8Array, html: string): void {
    const mode = this._mode();
    if (mode === 'driver' || !this.inBrowser) {
      this.print(html);
      return;
    }
    this.link
      .write(mode, bytes())
      .then(() => this._error.set(null))
      .catch((e: Error) => {
        this._error.set(e.message);
        this.print(html);
      });
  }

  private print(body: string): void {
    if (!this.inBrowser) return;
    const width = this._width();
    const frame = this.document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    this.document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>
      @page { size: ${width}mm auto; margin: 2mm; }
      body { margin: 0; width: ${width - 4}mm; font: ${width === 58 ? 10 : 12}px/1.35 ui-monospace, Menlo, Consolas, monospace; color: #000; }
      h1 { font-size: 1.25em; text-align: center; margin: 0 0 2px; }
      p { margin: 4px 0; } .c { text-align: center; } .b { font-weight: bold; } .r { text-align: right; white-space: nowrap; }
      table { width: 100%; border-collapse: collapse; } td { vertical-align: top; padding: 1px 0; }
      table.t { border-top: 1px dashed #000; margin-top: 4px; } .q { width: 2.5em; font-weight: bold; font-size: 1.2em; }
      table.kot td { font-size: 1.15em; padding: 3px 0; border-bottom: 1px dotted #000; } small { font-size: .85em; }
    </style></head><body>${body}</body></html>`);
    doc.close();
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1000);
  }

  private read(key: string): string | null {
    if (!this.inBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* not remembered */
    }
  }

  private readWidth(): PaperWidth {
    if (!this.inBrowser) return 80;
    try {
      return localStorage.getItem(WIDTH_KEY) === '58' ? 58 : 80;
    } catch {
      return 80;
    }
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
