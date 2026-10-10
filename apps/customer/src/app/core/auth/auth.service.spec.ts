import { TestBed } from '@angular/core/testing';
import { RoutingService } from 'src/app/service/routing.service';
import { AuthService } from './auth.service';
import { SUPABASE } from '../supabase.client';

// No network: the Supabase client is replaced by a mock.
const auth = {
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
};


describe('AuthService (Supabase)', () => {
  let service: AuthService;

  beforeEach(async () => {
    Object.values(auth).forEach((f) => f.mockReset());
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
    TestBed.configureTestingModule({
      providers: [
        { provide: RoutingService, useValue: { navigateUrl: vi.fn() } },
        { provide: SUPABASE, useValue: { auth } },
      ],
    });
    service = TestBed.inject(AuthService);
    await service.ready;
  });

  it('creates the session listener on the client', () => {
    expect(auth.getSession).toHaveBeenCalled();
    expect(auth.onAuthStateChange).toHaveBeenCalled();
    expect(service.session()).toBeNull();
  });

  it('sends an SMS OTP when signed out and returns errors instead of throwing', async () => {
    auth.signInWithOtp.mockResolvedValue({ data: null, error: { message: 'Unsupported phone provider' } });
    const res = await service.sendOtp('+911234567890');
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+911234567890' });
    expect(res.error?.message).toBe('Unsupported phone provider');
  });

  it('turns a thrown client error into a structured result', async () => {
    auth.signInWithOtp.mockRejectedValue(new Error('network down'));
    const res = await service.sendOtp('+911234567890');
    expect(res.data).toBeNull();
    expect(res.error?.message).toBe('network down');
  });

  it('verifies the OTP with type sms', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: null });
    const res = await service.verifyOtp('+911234567890', '123456');
    expect(auth.verifyOtp).toHaveBeenCalledWith({ phone: '+911234567890', token: '123456', type: 'sms' });
    expect(res.error).toBeNull();
  });
});
