/**
 * Sends raw ESC/POS bytes to a thermal printer straight from Chrome or Edge, with no driver
 * or print dialog:
 *
 * - **USB** (WebUSB): printers that show up as a USB printer. Works on Android Chrome and on
 *   Linux/ChromeOS. On Windows the installed printer driver holds the device, so use a printer
 *   in virtual-COM mode (Serial below) or keep the driver print mode.
 * - **Serial** (Web Serial): USB-serial (virtual COM) printers and Bluetooth printers paired
 *   as a COM port. 9600 baud, the usual factory setting.
 *
 * The browser only shows its device picker on a click, so pairing is a button. After that the
 * permission is remembered for this site, and printing reconnects to the same device on its own.
 * These APIs are not in TypeScript's DOM types yet, so the few calls used are typed here.
 */

export type ThermalMode = 'usb' | 'serial';

interface SerialPortLike {
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  getInfo(): { usbVendorId?: number; usbProductId?: number };
}
interface SerialLike {
  requestPort(): Promise<SerialPortLike>;
  getPorts(): Promise<SerialPortLike[]>;
}
interface UsbEndpoint {
  endpointNumber: number;
  direction: 'in' | 'out';
  type: 'bulk' | 'interrupt' | 'isochronous';
}
interface UsbInterface {
  interfaceNumber: number;
  claimed: boolean;
  alternate: { interfaceClass: number; endpoints: UsbEndpoint[] };
}
interface UsbDeviceLike {
  readonly opened: boolean;
  readonly productName?: string;
  readonly manufacturerName?: string;
  readonly configuration: { interfaces: UsbInterface[] } | null;
  open(): Promise<void>;
  selectConfiguration(value: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  transferOut(endpoint: number, data: Uint8Array): Promise<{ status: string }>;
}
interface UsbLike {
  requestDevice(options: { filters: object[] }): Promise<UsbDeviceLike>;
  getDevices(): Promise<UsbDeviceLike[]>;
}

const BAUD = 9600;
const PRINTER_CLASS = 7;
const CHUNK = 4096;

const serialApi = (): SerialLike | undefined => (globalThis.navigator as unknown as { serial?: SerialLike } | undefined)?.serial;
const usbApi = (): UsbLike | undefined => (globalThis.navigator as unknown as { usb?: UsbLike } | undefined)?.usb;

export function thermalSupported(mode: ThermalMode): boolean {
  return mode === 'usb' ? !!usbApi() : !!serialApi();
}

export class ThermalLink {
  private port: SerialPortLike | null = null;
  private device: UsbDeviceLike | null = null;
  private endpoint = 0;

  /** Shows the browser's device picker (call from a click). Returns a name for the device. */
  public async pair(mode: ThermalMode): Promise<string> {
    if (mode === 'serial') {
      const api = serialApi();
      if (!api) throw new Error('This browser cannot reach serial printers. Use Chrome or Edge.');
      this.port = await api.requestPort();
      await this.openPort(this.port);
      const info = this.port.getInfo();
      return info.usbVendorId ? `Serial printer (USB ${hex(info.usbVendorId)}:${hex(info.usbProductId ?? 0)})` : 'Serial / Bluetooth printer';
    }
    const api = usbApi();
    if (!api) throw new Error('This browser cannot reach USB printers. Use Chrome or Edge.');
    this.device = await api.requestDevice({ filters: [{ classCode: PRINTER_CLASS }] }).catch(() => api.requestDevice({ filters: [] }));
    await this.openDevice(this.device);
    return [this.device.manufacturerName, this.device.productName].filter(Boolean).join(' ') || 'USB printer';
  }

  /** Is a device already allowed for this site (so printing can reconnect without a click)? */
  public async hasDevice(mode: ThermalMode): Promise<boolean> {
    if (mode === 'serial') return !!this.port || !!(await serialApi()?.getPorts())?.length;
    return !!this.device || !!(await usbApi()?.getDevices())?.length;
  }

  public async write(mode: ThermalMode, data: Uint8Array): Promise<void> {
    if (mode === 'serial') {
      const port = this.port ?? (await serialApi()?.getPorts())?.[0];
      if (!port) throw new Error('No printer paired. Pair it in the menu first.');
      this.port = port;
      if (!port.writable) await this.openPort(port);
      const writer = port.writable!.getWriter();
      try {
        for (let i = 0; i < data.length; i += CHUNK) await writer.write(data.subarray(i, i + CHUNK));
      } finally {
        writer.releaseLock();
      }
      return;
    }
    const device = this.device ?? (await usbApi()?.getDevices())?.[0];
    if (!device) throw new Error('No printer paired. Pair it in the menu first.');
    if (device !== this.device || !device.opened || !this.endpoint) await this.openDevice(device);
    for (let i = 0; i < data.length; i += CHUNK) {
      const res = await device.transferOut(this.endpoint, data.subarray(i, i + CHUNK));
      if (res.status !== 'ok') throw new Error('The printer did not take the data (' + res.status + ')');
    }
  }

  private async openPort(port: SerialPortLike): Promise<void> {
    try {
      await port.open({ baudRate: BAUD });
    } catch (e) {
      // Already open from an earlier print in this tab.
      if (!port.writable) throw e;
    }
  }

  private async openDevice(device: UsbDeviceLike): Promise<void> {
    if (!device.opened) await device.open();
    if (!device.configuration) await device.selectConfiguration(1);
    const interfaces = device.configuration?.interfaces ?? [];
    const pick =
      interfaces.find((i) => i.alternate.interfaceClass === PRINTER_CLASS && bulkOut(i)) ?? interfaces.find((i) => bulkOut(i));
    if (!pick) throw new Error('This USB device has no printer output.');
    if (!pick.claimed) {
      try {
        await device.claimInterface(pick.interfaceNumber);
      } catch {
        throw new Error('The printer is held by its Windows driver. Use the print dialog mode, or set the printer to virtual COM and pair it as Serial.');
      }
    }
    this.device = device;
    this.endpoint = bulkOut(pick)!.endpointNumber;
  }
}

function bulkOut(i: UsbInterface): UsbEndpoint | undefined {
  return i.alternate.endpoints.find((e) => e.direction === 'out' && e.type === 'bulk');
}

function hex(n: number): string {
  return n.toString(16).padStart(4, '0');
}
