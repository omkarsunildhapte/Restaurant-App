import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { BankDetails } from '@pages/bank-details/bank-details';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NotImplementedError } from '@utils/errors/errors.util';
import { BANK_DETAILS_PAGE } from '@constants/bank-details.constants';
import { VALIDATION_MESSAGES } from '@constants/messages.constants';
import { fakeAlertService, fakeAuthService } from '@testing/doubles';

describe('BankDetails', () => {
  let alerts: ReturnType<typeof fakeAlertService>;
  const getBankDetails = vi.fn();
  const saveBankDetails = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [BankDetails],
      providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuthService() }, { provide: RiderService, useValue: { getBankDetails, saveBankDetails } }, { provide: AlertService, useValue: alerts }],
    });
    const fixture = TestBed.createComponent(BankDetails);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    alerts = fakeAlertService();
    getBankDetails.mockResolvedValue(null);
    saveBankDetails.mockReset();
  });

  it('validates the UPI ID', async () => {
    const fixture = create();
    await fixture.whenStable();
    const upi = fixture.componentInstance.bankForm.upiId;
    upi().value.set('not a upi');
    expect(upi().errors().map((e) => e.message)).toContain(VALIDATION_MESSAGES.UPI_INVALID);
    upi().value.set('rider@okbank');
    expect(upi().valid()).toBe(true);
  });

  it('pre-fills from the saved details', async () => {
    getBankDetails.mockResolvedValue({ upiId: 'saved@bank' });
    const fixture = create();
    await fixture.whenStable();
    expect(fixture.componentInstance.bankForm.upiId().value()).toBe('saved@bank');
  });

  it('toasts "Not connected yet" on save', async () => {
    const error = new NotImplementedError('save');
    saveBankDetails.mockRejectedValue(error);
    const fixture = create();
    await fixture.whenStable();
    fixture.componentInstance.bankForm.upiId().value.set('rider@okbank');
    await submit(fixture.componentInstance.bankForm);
    expect(saveBankDetails).toHaveBeenCalledWith('rider-1', { upiId: 'rider@okbank' });
    expect(alerts.saveFailed).toHaveBeenCalledWith(BANK_DETAILS_PAGE.ALERT_TITLE, error);
  });
});
