import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { ForgotPassword } from '@pages/forgot-password/forgot-password';
import { AuthService } from '@services/auth/auth.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { FORGOT_PASSWORD_PAGE } from '@constants/forgot-password.constants';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { fakeAlertService, fakeAuthService, fakeNavigationService } from '@testing/doubles';

describe('ForgotPassword', () => {
  let auth: ReturnType<typeof fakeAuthService>;
  let alerts: ReturnType<typeof fakeAlertService>;
  let navigation: ReturnType<typeof fakeNavigationService>;

  function create() {
    TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: AlertService, useValue: alerts }, { provide: NavigationService, useValue: navigation }],
    });
    const fixture = TestBed.createComponent(ForgotPassword);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    auth = fakeAuthService(null);
    alerts = fakeAlertService();
    navigation = fakeNavigationService();
  });

  it('does not submit an invalid e-mail', async () => {
    const component = create();
    component.forgotForm.email().value.set('nope');
    await submit(component.forgotForm);
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('sends the reset e-mail and returns to login', async () => {
    const component = create();
    component.forgotForm.email().value.set('rider@thaliyo.test');
    await submit(component.forgotForm);
    expect(auth.resetPassword).toHaveBeenCalledWith('rider@thaliyo.test');
    expect(navigation.root).toHaveBeenCalledWith(APP_ROUTE_LINKS.LOGIN);
    expect(alerts.presentAlert).toHaveBeenCalledWith(FORGOT_PASSWORD_PAGE.ALERT_TITLE, FORGOT_PASSWORD_PAGE.SUCCESS_MESSAGE, 'success');
  });

  it('shows the error when the reset fails', async () => {
    auth.resetPassword.mockRejectedValue(new Error('rate limited'));
    const component = create();
    component.forgotForm.email().value.set('rider@thaliyo.test');
    await submit(component.forgotForm);
    expect(alerts.presentError).toHaveBeenCalledWith(FORGOT_PASSWORD_PAGE.ALERT_TITLE, expect.any(Error), ERROR_MESSAGES.RESET_FAILED);
  });
});
