import { Injectable, InjectionToken, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from '@app/core/supabase.client';

/** Where the outbox sends writes. A token so tests can stand in for the server. */
export const OUTBOX_CLIENT = new InjectionToken<() => SupabaseClient>('OUTBOX_CLIENT', { providedIn: 'root', factory: () => db });

/**
 * Offline mode: every write the staff app makes goes through this outbox.
 *
 * Online, a write is sent straight away (and still waits its turn behind older ones, so order
 * is kept). Offline, or when the network call fails, it stays queued in localStorage and is
 * sent in order when the connection comes back. Rows are created with ids made on the device
 * (crypto.randomUUID), so an order taken offline can get items, a KOT and a bill before the
 * server has ever seen it.
 *
 * A write the server refuses (a rule or validation, not the network) is not retried forever:
 * it moves to `failed`, shown to the person, who can retry or discard it.
 */
export type OutboxOp =
  | { kind: 'insert'; table: string; row: Record<string, unknown> }
  | { kind: 'update'; table: string; id: string; patch: Record<string, unknown> }
  | { kind: 'delete'; table: string; id: string }
  | { kind: 'rpc'; fn: string; args: Record<string, unknown> };

export interface OutboxEntry {
  id: string;
  op: OutboxOp;
  label: string;
  queuedAt: string;
  error?: string;
}

const KEY = 'rp-staff.outbox';

@Injectable({ providedIn: 'root' })
export class Outbox {
  private readonly inBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly client = inject(OUTBOX_CLIENT);

  private readonly _pending = signal<OutboxEntry[]>(this.load('pending'));
  private readonly _failed = signal<OutboxEntry[]>(this.load('failed'));
  private readonly _online = signal(this.inBrowser ? navigator.onLine : true);
  private flushing = false;

  readonly pending = this._pending.asReadonly();
  readonly failed = this._failed.asReadonly();
  readonly online = this._online.asReadonly();
  readonly pendingCount = computed(() => this._pending().length);

  constructor() {
    if (!this.inBrowser) return;
    window.addEventListener('online', () => {
      this._online.set(true);
      void this.flush();
    });
    window.addEventListener('offline', () => this._online.set(false));
    // A queue left over from a closed tab, or a network that recovered without an event.
    setInterval(() => void this.flush(), 15000);
    void this.flush();
  }

  /**
   * Queues a write and tries to send the queue. Resolves with the server's answer when it was
   * sent now, or with null when it stays queued for later (offline). Rejects only when the
   * server refused this write (the entry is then in `failed`).
   */
  public async send<T = unknown>(op: OutboxOp, label: string): Promise<T | null> {
    const entry: OutboxEntry = { id: crypto.randomUUID(), op, label, queuedAt: new Date().toISOString() };
    this._pending.update((list) => [...list, entry]);
    this.save();
    const results = await this.flush();
    if (results.has(entry.id)) return results.get(entry.id) as T;
    const failed = this._failed().find((f) => f.id === entry.id);
    if (failed) throw new Error(failed.error);
    return null;
  }

  /** Sends queued writes in order; stops at the first network failure (still offline). */
  public async flush(): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    if (this.flushing || !this.inBrowser) return results;
    this.flushing = true;
    try {
      while (this._pending().length) {
        const entry = this._pending()[0]!;
        let outcome: { ok: true; data: unknown } | { ok: false; network: boolean; message: string };
        try {
          outcome = await run(this.client(), entry.op);
        } catch (e) {
          outcome = { ok: false, network: true, message: (e as Error).message };
        }
        if (!outcome.ok && outcome.network) {
          this._online.set(false);
          break;
        }
        this._online.set(true);
        this._pending.update((list) => list.slice(1));
        if (outcome.ok) {
          results.set(entry.id, outcome.data);
        } else {
          this._failed.update((list) => [...list, { ...entry, error: outcome.message }]);
        }
        this.save();
      }
    } finally {
      this.flushing = false;
    }
    return results;
  }

  public retry(id: string): void {
    const entry = this._failed().find((f) => f.id === id);
    if (!entry) return;
    this._failed.update((list) => list.filter((f) => f.id !== id));
    this._pending.update((list) => [...list, { ...entry, error: undefined }]);
    this.save();
    void this.flush();
  }

  public discard(id: string): void {
    this._failed.update((list) => list.filter((f) => f.id !== id));
    this.save();
  }

  private load(which: 'pending' | 'failed'): OutboxEntry[] {
    if (!this.inBrowser) return [];
    try {
      return (JSON.parse(localStorage.getItem(KEY) ?? '{}')[which] as OutboxEntry[]) ?? [];
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify({ pending: this._pending(), failed: this._failed() }));
    } catch {
      /* storage full or blocked: the queue still works for this tab */
    }
  }
}

async function run(client: SupabaseClient, op: OutboxOp): Promise<{ ok: true; data: unknown } | { ok: false; network: boolean; message: string }> {
  const res =
    op.kind === 'insert'
      ? await client.from(op.table).insert(op.row).select().single()
      : op.kind === 'update'
        ? await client.from(op.table).update(op.patch).eq('id', op.id).select().single()
        : op.kind === 'delete'
          ? await client.from(op.table).delete().eq('id', op.id)
          : await client.rpc(op.fn, op.args);
  if (!res.error) return { ok: true, data: res.data };
  // A refusal from the server always carries a Postgres/PostgREST code (42501, P0001, PGRST…).
  // No code, status 0, or the browser saying it is offline all mean the request never arrived:
  // keep it queued. (Offline, supabase-js returns an error with an empty message and no code.)
  const status = (res as { status?: number }).status;
  const network = !res.error.code || status === 0 || (typeof navigator !== 'undefined' && !navigator.onLine);
  return { ok: false, network, message: res.error.message || 'The server refused this change' };
}
