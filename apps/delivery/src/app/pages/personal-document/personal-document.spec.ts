import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { PersonalDocument } from '@pages/personal-document/personal-document';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { PERSONAL_DOCUMENT_PAGE } from '@constants/personal-document.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { fakeAlertService, fakeAuthService, fakeNavigationService } from '@testing/doubles';

describe('PersonalDocument', () => {
  let alerts: ReturnType<typeof fakeAlertService>;
  let navigation: ReturnType<typeof fakeNavigationService>;
  const saveDocuments = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [PersonalDocument],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: fakeAuthService() },
        { provide: RiderService, useValue: { saveDocuments } },
        { provide: AlertService, useValue: alerts },
        { provide: NavigationService, useValue: navigation },
      ],
    });
    const fixture = TestBed.createComponent(PersonalDocument);
    fixture.detectChanges();
    return fixture;
  }

  function pick(file: File): Event {
    return { target: { files: { item: () => file } } } as unknown as Event;
  }

  beforeEach(() => {
    alerts = fakeAlertService();
    navigation = fakeNavigationService();
    saveDocuments.mockReset();
  });

  it('shows one upload card per document', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelectorAll('ion-card').length).toBe(PERSONAL_DOCUMENT_PAGE.FIELDS.length);
  });

  it('keeps images and ignores other files', async () => {
    const component = create().componentInstance;
    await component.onFileSelected(pick(new File(['x'], 'a.png', { type: 'image/png' })), 'profile');
    expect(component.documentForm.profile().value().startsWith('data:image/png')).toBe(true);
    await component.onFileSelected(pick(new File(['x'], 'a.pdf', { type: 'application/pdf' })), 'profile');
    expect(component.documentForm.profile().value()).toBe('');
  });

  it('names the first missing document', async () => {
    const component = create().componentInstance;
    await submit(component.documentForm);
    expect(alerts.presentAlert).toHaveBeenCalledWith(PERSONAL_DOCUMENT_PAGE.ALERT_TITLE, VALIDATION_MESSAGES.DOCUMENT_PROFILE_REQUIRED, 'error');
    expect(saveDocuments).not.toHaveBeenCalled();
  });

  it('saves all three and moves on to the orders', async () => {
    saveDocuments.mockResolvedValue(undefined);
    const component = create().componentInstance;
    for (const field of PERSONAL_DOCUMENT_PAGE.FIELDS) {
      component.documentForm[field.key]().value.set('data:image/png;base64,AA==');
    }
    component.clear('nationalId');
    expect(component.documentForm.nationalId().value()).toBe('');
    component.documentForm.nationalId().value.set('data:image/png;base64,AA==');
    await submit(component.documentForm);
    expect(saveDocuments).toHaveBeenCalledWith('rider-1', expect.objectContaining({ nationalId: 'data:image/png;base64,AA==' }));
    expect(navigation.forward).toHaveBeenCalledWith(APP_ROUTE_LINKS.ORDER);
  });
});
