import { TestBed } from '@angular/core/testing';
import { RiderService } from '@services/rider/rider.service';
import { isNotImplemented } from '@utils/errors/errors.util';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';

describe('RiderService (Phase 5 stub)', () => {
  let service: RiderService;
  beforeEach(() => (service = TestBed.inject(RiderService)));

  it('reads resolve empty', async () => {
    expect(await service.getProfile('rider-1')).toBeNull();
    expect(await service.getVehicle('rider-1')).toBeNull();
    expect(await service.getBankDetails('rider-1')).toBeNull();
  });

  it('writes reject with NotImplementedError', async () => {
    const results = await Promise.allSettled([
      service.savePersonalInfo('rider-1', PERSONAL_INFORMATION_PAGE.EMPTY_FORM),
      service.saveDocuments('rider-1', { profile: '', drivingLicence: '', nationalId: '' }),
      service.saveVehicle('rider-1', { vehicleType: 'scooter', vehicleNumber: 'MH01' }),
      service.saveBankDetails('rider-1', { upiId: 'a@b' }),
    ]);
    results.forEach((result) => expect(result.status === 'rejected' && isNotImplemented(result.reason)).toBe(true));
  });
});
