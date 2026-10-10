import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { Welcome } from '@pages/welcome/welcome';
import { AuthService } from '@services/auth/auth.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { WELCOME_PAGE } from '@constants/welcome.constants';
import { fakeAlertService, fakeAuthService, fakeNavigationService, fakeSession } from '@testing/doubles';

describe('Welcome', () => {
  let auth: ReturnType<typeof fakeAuthService>;
  let alerts: ReturnType<typeof fakeAlertService>;
  let navigation: ReturnType<typeof fakeNavigationService>;

  async function create() {
    TestBed.configureTestingModule({
      imports: [Welcome],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: AlertService, useValue: alerts }, { provide: NavigationService, useValue: navigation }],
    });
    const fixture = TestBed.createComponent(Welcome);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    auth = fakeAuthService(fakeSession({ name: 'Sagar Pawar', email: 'sagar@rider.test' }));
    alerts = fakeAlertService();
    navigation = fakeNavigationService();
  });

  it('greets the invited rider once the link has signed them in', async () => {
    const fixture = await create();
    await vi.waitFor(() => expect(fixture.componentInstance.state()).toBe('ready'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Welcome, Sagar');
    expect(fixture.nativeElement.textContent).toContain('sagar@rider.test');
  });

  it('says the link expired when no session arrives', async () => {
    vi.useFakeTimers();
    auth.getSession.mockResolvedValue(null);
    const fixture = await create();
    await vi.advanceTimersByTimeAsync(WELCOME_PAGE.SESSION_POLL_ATTEMPTS * WELCOME_PAGE.SESSION_POLL_INTERVAL_MS + 100);
    vi.useRealTimers();
    expect(fixture.componentInstance.state()).toBe('no-session');
  });

  it('needs 8 characters and the same password twice', async () => {
    const form = (await create()).componentInstance.welcomeForm;
    form.password().value.set('short');
    form.confirmPassword().value.set('different');
    expect(form.password().errors().map((e) => e.message)).toContain(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH);
    expect(form.confirmPassword().errors().map((e) => e.message)).toContain(VALIDATION_MESSAGES.PASSWORDS_MISMATCH);
  });

  it('saves the password and continues to personal information', async () => {
    const form = (await create()).componentInstance.welcomeForm;
    form.password().value.set('a-good-password');
    form.confirmPassword().value.set('a-good-password');
    await submit(form);
    expect(auth.updatePassword).toHaveBeenCalledWith('a-good-password');
    expect(navigation.root).toHaveBeenCalledWith(APP_ROUTE_LINKS.PERSONAL_INFORMATION);
  });

  it('shows why saving failed', async () => {
    auth.updatePassword.mockRejectedValue(new Error('Password is too weak'));
    const form = (await create()).componentInstance.welcomeForm;
    form.password().value.set('a-good-password');
    form.confirmPassword().value.set('a-good-password');
    await submit(form);
    expect(alerts.presentError).toHaveBeenCalled();
    expect(navigation.root).not.toHaveBeenCalled();
  });
});
