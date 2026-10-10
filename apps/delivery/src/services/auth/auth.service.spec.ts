import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@services/auth/auth.service';
import { SupabaseService } from '@services/supabase/supabase.service';
import { AuthServiceError } from '@utils/errors/errors.util';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { LEGACY_STORAGE_KEYS } from '@constants/storage-keys.constants';
import { fakeSession, fakeSupabaseService } from '@testing/doubles';

describe('AuthService', () => {
  let supabase: ReturnType<typeof fakeSupabaseService>;
  let service: AuthService;

  beforeEach(() => {
    supabase = fakeSupabaseService();
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: supabase }] });
    service = TestBed.inject(AuthService);
  });

  it('restores the stored session and follows auth state changes', async () => {
    const session = fakeSession();
    supabase.auth.getSession.mockResolvedValue({ data: { session }, error: null });
    expect(await service.getSession()).toBe(session);
    expect(service.userId()).toBe('rider-1');
    expect(service.displayName()).toBe('Test Rider');
    expect(service.accessToken()).toBe('test-token');

    const onChange = supabase.auth.onAuthStateChange.mock.calls[0][0];
    onChange('SIGNED_OUT', null);
    expect(service.session()).toBeNull();
  });

  it('signs in and exposes the session', async () => {
    const session = fakeSession({ email: 'a@b.test' });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session }, error: null });
    await expect(service.login('a@b.test', 'pw')).resolves.toBe(session);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.test', password: 'pw' });
    expect(service.email()).toBe('a@b.test');
  });

  it('turns a Supabase error into an AuthServiceError', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials', code: 'invalid_credentials' } });
    await expect(service.login('a@b.test', 'pw')).rejects.toMatchObject({ message: 'Invalid login credentials', code: 'invalid_credentials' });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null });
    await expect(service.login('a@b.test', 'pw')).rejects.toThrowError(ERROR_MESSAGES.LOGIN_FAILED);
  });

  it('registers with the display name in user metadata', async () => {
    supabase.auth.signUp.mockResolvedValue({ data: { session: null }, error: null });
    await expect(service.register('Rider', 'a@b.test', 'secret1')).resolves.toBeNull();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.test', password: 'secret1', options: { data: { display_name: 'Rider' } } });

    supabase.auth.signUp.mockResolvedValue({ data: { session: null }, error: { message: 'User already registered', code: 'user_already_exists' } });
    const error = await service.register('Rider', 'a@b.test', 'secret1').catch((e: unknown) => e);
    expect(service.isEmailInUse(error)).toBe(true);
    expect(service.isEmailInUse(new AuthServiceError('x', 'other'))).toBe(false);
  });

  it('sends the reset e-mail back to /login and reports failures', async () => {
    await service.resetPassword('a@b.test');
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.test', { redirectTo: `${location.origin}/login` });
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { message: '' } });
    await expect(service.resetPassword('a@b.test')).rejects.toThrowError(ERROR_MESSAGES.RESET_FAILED);
  });

  it('signs out and clears the session', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { session: fakeSession() }, error: null });
    await service.login('a@b.test', 'pw');
    await service.logout();
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(service.session()).toBeNull();
  });

  it('removes the pre-Supabase localStorage keys', () => {
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, 'stale'));
    service.clearLegacyState();
    LEGACY_STORAGE_KEYS.forEach((key) => expect(localStorage.getItem(key)).toBeNull());
  });
});

describe('AuthService on the server', () => {
  it('has no session and touches no storage', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(AuthService);
    expect(await service.getSession()).toBeNull();
    localStorage.setItem('uid', 'kept');
    service.clearLegacyState();
    expect(localStorage.getItem('uid')).toBe('kept');
    localStorage.removeItem('uid');
  });
});
