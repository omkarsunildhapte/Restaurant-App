import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { Login } from '@pages/login/login';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { LOGIN_PAGE } from '@constants/login.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { fakeAlertService, fakeAuthService, fakeNavigationService } from '@testing/doubles';

describe('Login', () => {
  let auth: ReturnType<typeof fakeAuthService>;
  let alerts: ReturnType<typeof fakeAlertService>;
  let navigation: ReturnType<typeof fakeNavigationService>;
  const getProfile = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: RiderService, useValue: { getProfile } },
        { provide: AlertService, useValue: alerts },
        { provide: NavigationService, useValue: navigation },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    auth = fakeAuthService(null);
    alerts = fakeAlertService();
    navigation = fakeNavigationService();
    getProfile.mockResolvedValue(null);
  });

  it('renders the form', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelector('[data-testid="login-submit"]')).not.toBeNull();
  });

  it('is invalid until both fields are filled with a valid e-mail', () => {
    const component = create().componentInstance;
    expect(component.loginForm().invalid()).toBe(true);
    component.loginForm.email().value.set('not-an-email');
    component.loginForm.password().value.set('pw');
    expect(component.loginForm.email().invalid()).toBe(true);
    component.loginForm.email().value.set('rider@thaliyo.test');
    expect(component.loginForm().valid()).toBe(true);
  });

  it('signs in, then continues onboarding when there is no profile yet', async () => {
    const component = create().componentInstance;
    component.loginForm.email().value.set('rider@thaliyo.test');
    component.loginForm.password().value.set('pw');
    await submit(component.loginForm);
    expect(auth.login).toHaveBeenCalledWith('rider@thaliyo.test', 'pw');
    expect(alerts.presentAlert).toHaveBeenCalledWith(LOGIN_PAGE.ALERT_TITLE, LOGIN_PAGE.SUCCESS_MESSAGE, 'success');
    expect(navigation.root).toHaveBeenCalledWith(APP_ROUTE_LINKS.PERSONAL_INFORMATION);
  });

  it('goes to the orders when the profile is complete', async () => {
    getProfile.mockResolvedValue({ uid: 'rider-1', email: '', displayName: '', phoneNumber: '9999999999' });
    const component = create().componentInstance;
    component.loginForm.email().value.set('rider@thaliyo.test');
    component.loginForm.password().value.set('pw');
    await submit(component.loginForm);
    expect(navigation.root).toHaveBeenCalledWith(APP_ROUTE_LINKS.ORDER);
  });

  it('shows the Supabase error and stays put', async () => {
    auth.login.mockRejectedValue(new Error('Invalid login credentials'));
    const component = create().componentInstance;
    component.loginForm.email().value.set('rider@thaliyo.test');
    component.loginForm.password().value.set('pw');
    await submit(component.loginForm);
    expect(alerts.presentError).toHaveBeenCalledWith(LOGIN_PAGE.ALERT_TITLE, expect.any(Error), ERROR_MESSAGES.LOGIN_FAILED);
    expect(navigation.root).not.toHaveBeenCalled();
  });
});

