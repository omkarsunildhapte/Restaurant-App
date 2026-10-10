import { TestBed } from '@angular/core/testing';
import { SupabaseClientService } from '../supabase.client';
import { AuthService } from './auth.service';

/** Builds a fake Supabase client: no network, just vi.fn() auth methods. */
function fakeSupabase(overrides: Record<string, unknown> = {}) {
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  };
  const client = { auth };
  const service = {
    configError: null,
    client,
    requireClient: () => client,
  } as unknown as SupabaseClientService;
  return { auth, service };
}

describe('AuthService', () => {
  function setup(service: SupabaseClientService) {
    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseClientService, useValue: service }],
    });
    return TestBed.inject(AuthService);
  }

  it('signs in with email + password and returns the session', async () => {
    const session = { user: { id: 'u1', email: 'owner@example.test' } };
    const { auth, service } = fakeSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session }, error: null }),
    });
    const authService = setup(service);

    await expect(authService.signIn('owner@example.test', 'secret123')).resolves.toBe(session);
    expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({
      email: 'owner@example.test',
      password: 'secret123',
    });
  });

  it('rethrows Supabase sign-in errors', async () => {
    const error = new Error('Invalid login credentials');
    const { service } = fakeSupabase({
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error }),
    });
    const authService = setup(service);

    await expect(authService.signIn('a@b.test', 'wrongpass')).rejects.toBe(error);
  });

  it('passes metadata on sign up', async () => {
    const { auth, service } = fakeSupabase();
    const authService = setup(service);

    await authService.signUp('new@example.test', 'secret123', { full_name: 'New User' });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'new@example.test',
      password: 'secret123',
      options: { data: { full_name: 'New User' } },
    });
  });

  it('tracks the session from onAuthStateChange', async () => {
    const { auth, service } = fakeSupabase();
    const authService = setup(service);
    await authService.ready;
    expect(authService.isSignedIn()).toBe(false);

    const listener = auth.onAuthStateChange.mock.calls[0][0];
    listener('SIGNED_IN', { user: { id: 'u2', email: 'x@y.test' } });
    expect(authService.user()?.email).toBe('x@y.test');
    expect(authService.isSignedIn()).toBe(true);
  });

  it('is inert when Supabase is not configured', async () => {
    const service = {
      configError: 'Supabase is not configured',
      client: null,
      requireClient: () => {
        throw new Error('Supabase is not configured');
      },
    } as unknown as SupabaseClientService;
    const authService = setup(service);

    expect(authService.configError).toBe('Supabase is not configured');
    await expect(authService.signIn('a@b.test', 'secret123')).rejects.toThrow('not configured');
    await expect(authService.signOut()).resolves.toBeUndefined();
  });
});
