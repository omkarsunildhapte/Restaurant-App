import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import { OUTBOX_CLIENT, Outbox } from './outbox';

// A stand-in server: each test decides what it answers, in order.
const answers: { error: { message: string; code?: string } | null; data?: unknown; status?: number }[] = [];
const fakeClient = {
  from: () => ({ insert: () => ({ select: () => ({ single: async () => answers.shift() }) }) }),
  rpc: async () => answers.shift(),
} as unknown as SupabaseClient;

// Node 25 puts its own (unconfigured) localStorage on globalThis, which shadows jsdom's in
// tests; a small in-memory Storage keeps these tests independent of that.
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe('Outbox', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true, writable: true });
    answers.length = 0;
    TestBed.configureTestingModule({ providers: [{ provide: OUTBOX_CLIENT, useValue: () => fakeClient }] });
  });

  it('sends online writes straight away and returns the server answer', async () => {
    answers.push({ error: null, data: { order_no: 7 } });
    const box = TestBed.inject(Outbox);
    await expect(box.send({ kind: 'insert', table: 'orders', row: {} }, 'x')).resolves.toEqual({ order_no: 7 });
    expect(box.pendingCount()).toBe(0);
  });

  it('keeps a write queued when the network fails (error without a code)', async () => {
    answers.push({ error: { message: '' }, status: 0 });
    const box = TestBed.inject(Outbox);
    await expect(box.send({ kind: 'rpc', fn: 'send_kot', args: {} }, 'KOT')).resolves.toBeNull();
    expect(box.pendingCount()).toBe(1);
    expect(box.failed().length).toBe(0);
    expect(box.online()).toBe(false);
    expect(JSON.parse(localStorage.getItem('rp-staff.outbox')!).pending.length).toBe(1);
  });

  it('moves a write the server refuses to failed, with the server message', async () => {
    answers.push({ error: { message: 'Open the day at the counter before billing', code: 'P0001' } });
    const box = TestBed.inject(Outbox);
    await expect(box.send({ kind: 'rpc', fn: 'settle_bill', args: {} }, 'Bill')).rejects.toThrow('Open the day');
    expect(box.failed()[0]?.error).toContain('Open the day');
  });

  it('sends queued writes in order once the connection is back', async () => {
    answers.push({ error: { message: '' } });
    const box = TestBed.inject(Outbox);
    await box.send({ kind: 'rpc', fn: 'a', args: {} }, 'first');
    await box.send({ kind: 'rpc', fn: 'b', args: {} }, 'second');
    expect(box.pendingCount()).toBe(2);
    answers.push({ error: null, data: 1 }, { error: null, data: 2 });
    const results = await box.flush();
    expect([...results.values()]).toEqual([1, 2]);
    expect(box.pendingCount()).toBe(0);
  });
});
