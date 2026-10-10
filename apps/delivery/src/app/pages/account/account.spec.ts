import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Account } from '@pages/account/account';
import { AuthService } from '@services/auth/auth.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { ACCOUNT_PAGE } from '@constants/account.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { fakeAuthService, fakeNavigationService, fakeSession } from '@testing/doubles';

describe('Account', () => {
  let auth: ReturnType<typeof fakeAuthService>;
  let navigation: ReturnType<typeof fakeNavigationService>;

  function create() {
    TestBed.configureTestingModule({ imports: [Account], providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: NavigationService, useValue: navigation }] });
    const fixture = TestBed.createComponent(Account);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    auth = fakeAuthService(fakeSession({ name: 'Ravi Kumar' }));
    navigation = fakeNavigationService();
  });

  it('shows the rider name and initial from the session', () => {
    const fixture = create();
    expect(fixture.componentInstance.displayName()).toBe('Ravi Kumar');
    expect(fixture.componentInstance.initial()).toBe('R');
    expect(fixture.nativeElement.querySelectorAll('ion-item').length).toBe(ACCOUNT_PAGE.GENERAL.length + ACCOUNT_PAGE.MORE.length);
  });

  it('falls back to the e-mail, then the default initial', () => {
    auth = fakeAuthService(fakeSession({ name: '', email: 'zed@thaliyo.test' }));
    expect(create().componentInstance.initial()).toBe('Z');
    TestBed.resetTestingModule();
    auth = fakeAuthService(null);
    expect(create().componentInstance.initial()).toBe(ACCOUNT_PAGE.FALLBACK_INITIAL);
  });

  it('signs out and returns to login', async () => {
    await create().componentInstance.logout();
    expect(auth.logout).toHaveBeenCalled();
    expect(navigation.root).toHaveBeenCalledWith(APP_ROUTE_LINKS.LOGIN);
  });
});
