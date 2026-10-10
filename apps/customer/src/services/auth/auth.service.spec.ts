import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@services/auth/auth.service';
import { SupabaseNotConfiguredError } from '@services/supabase/supabase.service';
import { TEST_SESSION, TEST_USER, createSupabaseMock, provideSupabase } from '@testing/supabase.mock';

function setup(session = null as typeof TEST_SESSION | null, client: 'mock' | 'none' = 'mock') {
  const supabase = createSupabaseMock(session);
  TestBed.configureTestingModule({ providers: [provideSupabase(client === 'mock' ? supabase.client : null)] });
  return { service: TestBed.inject(AuthService), auth: supabase.auth };
}

describe('AuthService', () => {
  it('restores the persisted session and listens for changes', async () => {
    const { service, auth } = setup(TEST_SESSION);
    await service.ready;
    expect(auth.getSession).toHaveBeenCalled();
    expect(auth.onAuthStateChange).toHaveBeenCalled();
    expect(service.currentUser()?.id).toBe(TEST_USER.id);
    expect(service.displayName()).toBe('Test User');
    expect(service.accessToken()).toBe('token-123');
  });

  it('signs in with email and password', async () => {
    const { service, auth } = setup();
    auth.signInWithPassword.mockResolvedValue({ data: { user: TEST_USER, session: TEST_SESSION }, error: null });
    await expect(service.login('a@b.c', 'pw')).resolves.toBe(TEST_USER);
    expect(service.session()).toBe(TEST_SESSION);
  });

  it('throws the Supabase error on a failed sign-in', async () => {
    const { service, auth } = setup();
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'bad' } });
    await expect(service.login('a@b.c', 'pw')).rejects.toEqual({ message: 'bad' });
  });

  it('registers with the display name in user_metadata', async () => {
    const { service, auth } = setup();
    auth.signUp.mockResolvedValue({ data: { user: TEST_USER }, error: null });
    await service.register('Asha', 'a@b.c', 'secret1');
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'a@b.c', password: 'secret1', options: { data: { display_name: 'Asha' } } });
  });

  it('sends a reset email', async () => {
    const { service, auth } = setup();
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await service.resetPassword('a@b.c');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.c');
  });

  it('re-checks the current password before updating it', async () => {
    const { service, auth } = setup(TEST_SESSION);
    await service.ready;
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
    auth.updateUser.mockResolvedValue({ data: {}, error: null });
    await service.updatePassword('old', 'new-secret');
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: TEST_USER.email, password: 'old' });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-secret' });
  });

  it('sends an SMS OTP when signed out and returns errors instead of throwing', async () => {
    const { service, auth } = setup();
    await service.ready;
    auth.signInWithOtp.mockResolvedValue({ data: null, error: { message: 'Unsupported phone provider' } });
    const res = await service.sendOtp('+911234567890');
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+911234567890' });
    expect(res.error?.message).toBe('Unsupported phone provider');
  });

  it('adds the phone to the signed-in account instead of creating a user', async () => {
    const { service, auth } = setup(TEST_SESSION);
    await service.ready;
    auth.updateUser.mockResolvedValue({ data: {}, error: null });
    await service.sendOtp('+911234567890');
    expect(auth.updateUser).toHaveBeenCalledWith({ phone: '+911234567890' });
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('turns a thrown client error into a structured result', async () => {
    const { service, auth } = setup();
    auth.signInWithOtp.mockRejectedValue(new Error('network down'));
    const res = await service.sendOtp('+911234567890');
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('network down');
  });

  it('verifies the OTP with type sms when signed out', async () => {
    const { service, auth } = setup();
    await service.ready;
    auth.verifyOtp.mockResolvedValue({ data: { session: TEST_SESSION }, error: null });
    const res = await service.verifyOtp('+911234567890', '123456');
    expect(auth.verifyOtp).toHaveBeenCalledWith({ phone: '+911234567890', token: '123456', type: 'sms' });
    expect(res.error).toBeNull();
    expect(service.session()).toBe(TEST_SESSION);
  });

  it('signs out', async () => {
    const { service, auth } = setup(TEST_SESSION);
    await service.ready;
    await service.signOut();
    expect(auth.signOut).toHaveBeenCalled();
    expect(service.session()).toBeNull();
  });

  it('reports a missing Supabase config clearly in the browser', async () => {
    const { service } = setup(null, 'none');
    await expect(service.ready).resolves.toBeNull();
    await expect(service.login('a@b.c', 'pw')).rejects.toBeInstanceOf(SupabaseNotConfiguredError);
    expect((await service.sendOtp('+91')).error).toBeInstanceOf(SupabaseNotConfiguredError);
  });

  it('is browser-only on the server', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabase(null), { provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(AuthService);
    await expect(service.login('a@b.c', 'pw')).rejects.toThrow('browser-only');
  });
});
