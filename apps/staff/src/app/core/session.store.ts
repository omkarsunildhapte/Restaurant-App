import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import type { Session } from '@supabase/supabase-js';
import { db, supabase } from '@app/core/supabase.client';
import type { Outlet, Role, Workspace } from '@app/core/models';

const PLACE_KEY = 'rp-staff.place';
const PLACES_CACHE = 'rp-staff.places';

/** Which screens each role works in, and where it lands after sign-in. */
export const MODES: Record<Role, readonly ('waiter' | 'kitchen' | 'pos')[]> = {
  admin: ['pos', 'waiter', 'kitchen'],
  owner: ['pos', 'waiter', 'kitchen'],
  manager: ['pos', 'waiter', 'kitchen'],
  cashier: ['pos', 'waiter'],
  waiter: ['waiter'],
  kitchen: ['kitchen'],
  delivery: [],
};

/**
 * Who is signed in (Supabase Auth, one login across the platform), and where they are
 * working: business, outlet and role. One device usually stays on one outlet all day, so the
 * choice is remembered on the device.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly router = inject(Router);
  private readonly inBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _session = signal<Session | null>(null);
  private readonly _workspaces = signal<Workspace[]>([]);
  private readonly _outlets = signal<Outlet[]>([]);
  private readonly _workspace = signal<Workspace | null>(null);
  private readonly _outlet = signal<Outlet | null>(null);
  private readonly _busy = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly session = this._session.asReadonly();
  readonly workspaces = this._workspaces.asReadonly();
  readonly outlets = this._outlets.asReadonly();
  readonly workspace = this._workspace.asReadonly();
  readonly outlet = this._outlet.asReadonly();
  readonly busy = this._busy.asReadonly();
  readonly error = this._error.asReadonly();

  readonly signedIn = computed(() => this._session() !== null);
  readonly ready = computed(() => this._workspace() !== null && this._outlet() !== null);
  readonly role = computed(() => this._workspace()?.role ?? null);
  readonly modes = computed(() => (this.role() ? MODES[this.role()!] : []));
  readonly personName = computed(() => {
    const u = this._session()?.user;
    return (u?.user_metadata?.['full_name'] as string | undefined) ?? u?.email?.split('@')[0] ?? '';
  });

  /** Restores the session and the remembered workplace before the first route (app initializer). */
  public async init(): Promise<void> {
    if (!this.inBrowser || !supabase) return;
    supabase.auth.onAuthStateChange((_event, session) => this._session.set(session));
    const { data } = await supabase.auth.getSession();
    this._session.set(data.session);
    if (!data.session) return;
    try {
      await this.loadPlaces();
    } catch (e) {
      // Never stop the app from starting: the chooser/login shows what went wrong.
      this._error.set((e as Error).message);
    }
  }

  public async login(email: string, password: string): Promise<void> {
    this._busy.set(true);
    this._error.set(null);
    try {
      const { data, error } = await db().auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email or password is incorrect' : error.message);
      this._session.set(data.session);
      await this.loadPlaces();
      if (!this._workspaces().length) {
        await this.logout();
        throw new Error('This account is not on the staff of any restaurant. Ask the owner to add you.');
      }
      void this.router.navigateByUrl(this.ready() ? this.home() : '/choose');
    } catch (e) {
      this._error.set((e as Error).message);
    } finally {
      this._busy.set(false);
    }
  }

  public async logout(): Promise<void> {
    if (supabase) await supabase.auth.signOut();
    this._session.set(null);
    this._workspace.set(null);
    this._outlet.set(null);
    void this.router.navigateByUrl('/login');
  }

  /** Picks the business and outlet to work in on this device. */
  public async choose(workspace: Workspace, outletId: string): Promise<void> {
    const outlet = this._outlets().find((o) => o.id === outletId && o.tenant_id === workspace.tenant_id);
    if (!outlet) return;
    this._workspace.set(workspace);
    this._outlet.set(outlet);
    try {
      localStorage.setItem(PLACE_KEY, JSON.stringify({ tenant: workspace.tenant_id, outlet: outlet.id }));
    } catch {
      /* not remembered: they choose again next time */
    }
    void this.router.navigateByUrl(this.home());
  }

  private cachedPlaces(userId: string): { workspaces: Workspace[]; outlets: Outlet[] } | null {
    try {
      const c = JSON.parse(localStorage.getItem(PLACES_CACHE) ?? 'null') as { userId: string; workspaces: Workspace[]; outlets: Outlet[] } | null;
      return c && c.userId === userId ? c : null;
    } catch {
      return null;
    }
  }

  /** The first screen for the current role. */
  public home(): string {
    const mode = this.modes()[0];
    return mode === 'kitchen' ? '/kitchen' : mode === 'waiter' ? '/waiter' : '/pos';
  }

  /** Outlets a workspace may work at: its own outlet, or all of them for business-wide roles. */
  public outletsFor(w: Workspace): Outlet[] {
    return this._outlets().filter((o) => o.tenant_id === w.tenant_id && (!w.outlet_id || o.id === w.outlet_id));
  }

  /**
   * Where this person may work. Fetched from the server, and kept on the device so the app
   * still opens without internet (offline mode); the saved copy is used only when the server
   * can't be reached, never when it answers.
   */
  private async loadPlaces(): Promise<void> {
    const userId = this._session()?.user.id ?? '';
    let workspaces: Workspace[];
    let outlets: Outlet[];
    try {
      const { data, error } = await db().rpc('my_workspaces');
      if (error) throw new Error(error.message);
      const res = await db().from('outlets').select('id, tenant_id, name, address, city, phone, gstin').eq('is_active', true).order('name');
      if (res.error) throw new Error(res.error.message);
      workspaces = ((data as Workspace[]) ?? []).filter((w) => MODES[w.role].length > 0);
      outlets = (res.data as Outlet[]) ?? [];
      try {
        localStorage.setItem(PLACES_CACHE, JSON.stringify({ userId, workspaces, outlets }));
      } catch {
        /* no offline copy */
      }
    } catch (e) {
      const cached = this.cachedPlaces(userId);
      if (!cached || navigator.onLine) throw e;
      workspaces = cached.workspaces;
      outlets = cached.outlets;
    }
    this._workspaces.set(workspaces);
    this._outlets.set(outlets);

    // Remembered place, or the only possible one.
    let saved: { tenant?: string; outlet?: string } = {};
    try {
      saved = JSON.parse(localStorage.getItem(PLACE_KEY) ?? '{}');
    } catch {
      saved = {};
    }
    const options = workspaces.flatMap((w) => this.outletsFor(w).map((o) => ({ w, o })));
    const pick = options.find((x) => x.w.tenant_id === saved.tenant && x.o.id === saved.outlet) ?? (options.length === 1 ? options[0] : undefined);
    if (pick) {
      this._workspace.set(pick.w);
      this._outlet.set(pick.o);
    }
  }
}
