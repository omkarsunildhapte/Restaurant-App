import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import type { DatetimeCustomEvent } from '@ionic/angular';
import { PersonalInformation } from '@pages/personal-information/personal-information';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { NotImplementedError } from '@utils/errors/errors.util';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { fakeAlertService, fakeAuthService, fakeNavigationService } from '@testing/doubles';

describe('PersonalInformation', () => {
  let alerts: ReturnType<typeof fakeAlertService>;
  let navigation: ReturnType<typeof fakeNavigationService>;
  const savePersonalInfo = vi.fn();
  const getPersonalInfo = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [PersonalInformation],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: fakeAuthService() },
        { provide: RiderService, useValue: { savePersonalInfo, getPersonalInfo } },
        { provide: AlertService, useValue: alerts },
        { provide: NavigationService, useValue: navigation },
      ],
    });
    const fixture = TestBed.createComponent(PersonalInformation);
    fixture.detectChanges();
    return fixture;
  }

  function fillAll(component: PersonalInformation) {
    for (const field of PERSONAL_INFORMATION_PAGE.FIELDS) {
      component.personalForm[field.key]().value.set(field.key === 'mobileNumber' ? '9876543210' : 'x');
    }
  }

  beforeEach(() => {
    alerts = fakeAlertService();
    navigation = fakeNavigationService();
    savePersonalInfo.mockReset();
    getPersonalInfo.mockReset().mockResolvedValue(null);
  });

  it('renders one row per field', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelectorAll('ion-item').length).toBe(PERSONAL_INFORMATION_PAGE.FIELDS.length);
  });

  it('checks the mobile number is 10 digits', () => {
    const component = create().componentInstance;
    component.personalForm.mobileNumber().value.set('123');
    expect(component.personalForm.mobileNumber().errors().map((e) => e.message)).toContain(VALIDATION_MESSAGES.MOBILE_PATTERN);
  });

  it('writes the picked date as yyyy-MM-dd', () => {
    const component = create().componentInstance;
    component.onDateChange({ detail: { value: '1995-08-15T00:00:00' } } as DatetimeCustomEvent);
    expect(component.personalForm.dateOfBirth().value()).toBe('1995-08-15');
  });

  it('toasts "Not connected yet" while saving is a stub', async () => {
    const error = new NotImplementedError('save');
    savePersonalInfo.mockRejectedValue(error);
    const component = create().componentInstance;
    fillAll(component);
    await submit(component.personalForm);
    expect(savePersonalInfo).toHaveBeenCalledWith('rider-1', expect.objectContaining({ mobileNumber: '9876543210' }));
    expect(alerts.saveFailed).toHaveBeenCalledWith(PERSONAL_INFORMATION_PAGE.ALERT_TITLE, error);
    expect(navigation.forward).not.toHaveBeenCalled();
  });

  it('moves on to the documents once saving works', async () => {
    savePersonalInfo.mockResolvedValue(undefined);
    const component = create().componentInstance;
    fillAll(component);
    await submit(component.personalForm);
    expect(navigation.forward).toHaveBeenCalledWith(APP_ROUTE_LINKS.PERSONAL_DOCUMENT);
  });

  it('fills in what was saved and keeps the national ID unless a new one is typed', async () => {
    const info = { ...PERSONAL_INFORMATION_PAGE.EMPTY_FORM, firstName: 'Sagar', lastName: 'Pawar', fathersName: 'Ramesh', dateOfBirth: '1998-04-12', mobileNumber: '9822033333', bloodGroup: 'O+', city: 'Pune', address: 'Baner', deliveryLicenseId: 'MH12' };
    getPersonalInfo.mockResolvedValue({ info, nationalIdLast4: '9012' });
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.personalForm.firstName().value()).toBe('Sagar');
    expect(fixture.nativeElement.querySelector('[data-testid="national-id-saved"]').textContent).toContain('9012');
    expect(component.personalForm.nationalId().valid()).toBe(true);
    expect(fixture.nativeElement.textContent).not.toContain('1234 5678');
  });
});
