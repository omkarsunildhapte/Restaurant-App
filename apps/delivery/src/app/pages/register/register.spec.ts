import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { Register } from '@pages/register/register';
import { AuthService } from '@services/auth/auth.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { REGISTER_PAGE } from '@constants/register.constants';
import { ERROR_MESSAGES, VALIDATION_MESSAGES } from '@constants/messages.constants';
import { fakeAlertService, fakeAuthService, fakeNavigationService } from '@testing/doubles';

describe('Register', () => {
  let auth: ReturnType<typeof fakeAuthService>;
  let alerts: ReturnType<typeof fakeAlertService>;
  let navigation: ReturnType<typeof fakeNavigationService>;

  function create() {
    TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: AlertService, useValue: alerts }, { provide: NavigationService, useValue: navigation }],
    });
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function fill(component: Register, confirm = 'secret1') {
    component.registerForm.name().value.set('Rider');
    component.registerForm.email().value.set('rider@thaliyo.test');
    component.registerForm.password().value.set('secret1');
    component.registerForm.confirmPassword().value.set(confirm);
  }

  beforeEach(() => {
    auth = fakeAuthService(null);
    alerts = fakeAlertService();
    navigation = fakeNavigationService();
  });

  it('requires a 6-character password and a matching confirmation', () => {
    const component = create();
    fill(component, 'different');
    expect(component.registerForm.confirmPassword().errors().map((e) => e.message)).toContain(VALIDATION_MESSAGES.PASSWORDS_MISMATCH);
    component.registerForm.password().value.set('123');
    expect(component.registerForm.password().errors().map((e) => e.message)).toContain(VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH);
  });

  it('creates the account and continues to personal information', async () => {
    const component = create();
    fill(component);
    await submit(component.registerForm);
    expect(auth.register).toHaveBeenCalledWith('Rider', 'rider@thaliyo.test', 'secret1');
    expect(navigation.forward).toHaveBeenCalledWith(APP_ROUTE_LINKS.PERSONAL_INFORMATION);
    expect(alerts.presentAlert).toHaveBeenCalledWith(REGISTER_PAGE.SUCCESS_TITLE, REGISTER_PAGE.SUCCESS_MESSAGE, 'success');
  });

  it('explains an e-mail that already has an account', async () => {
    auth.register.mockRejectedValue(new Error('User already registered'));
    auth.isEmailInUse.mockReturnValue(true);
    const component = create();
    fill(component);
    await submit(component.registerForm);
    expect(alerts.presentAlert).toHaveBeenCalledWith(REGISTER_PAGE.FAILURE_TITLE, ERROR_MESSAGES.EMAIL_IN_USE, 'error');
    expect(navigation.forward).not.toHaveBeenCalled();
  });
});
