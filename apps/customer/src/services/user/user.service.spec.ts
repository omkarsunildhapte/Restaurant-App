import { TestBed } from '@angular/core/testing';
import { AuthService } from '@services/auth/auth.service';
import { UserService } from '@services/user/user.service';
import { TEST_SESSION, TEST_USER, createSupabaseMock, provideSupabase } from '@testing/supabase.mock';
import { NotImplementedError } from '@utils/not-implemented/not-implemented.util';

describe('UserService', () => {
  it('builds the profile from the signed-in auth user', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabase(createSupabaseMock(TEST_SESSION).client)] });
    await TestBed.inject(AuthService).ready;
    expect(TestBed.inject(UserService).profile()).toEqual({ id: TEST_USER.id, email: TEST_USER.email, displayName: 'Test User', phoneNumber: '' });
  });

  it('has no profile when signed out', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabase(createSupabaseMock(null).client)] });
    await TestBed.inject(AuthService).ready;
    expect(TestBed.inject(UserService).profile()).toBeNull();
  });

  it('updating the account is a stub', async () => {
    TestBed.configureTestingModule({ providers: [provideSupabase(null)] });
    await expect(TestBed.inject(UserService).updateAccount('id', { displayName: 'a', email: 'b', phoneNumber: 'c' })).rejects.toBeInstanceOf(NotImplementedError);
  });
});
