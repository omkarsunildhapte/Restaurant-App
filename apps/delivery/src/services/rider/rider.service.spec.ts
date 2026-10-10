import { TestBed } from '@angular/core/testing';
import { RiderService } from '@services/rider/rider.service';
import { SupabaseService } from '@services/supabase/supabase.service';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { fakeDataClient, riderRow } from '@testing/delivery-fixtures';
import { isNotImplemented } from '@utils/errors/errors.util';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';

const personalInfo = { ...PERSONAL_INFORMATION_PAGE.EMPTY_FORM, firstName: 'Sagar', lastName: 'Pawar', mobileNumber: '9822033333', deliveryLicenseId: 'MH1220200012345' };

describe('RiderService', () => {
  function setup(row: ReturnType<typeof riderRow> | null = riderRow()) {
    const fake = fakeDataClient({ riders: { data: row, error: null } });
    const workspace = { current: vi.fn(async () => ({ tenantId: 'tenant-1', tenantName: 'Brew & Leaf', outletId: null, writable: true })) };
    TestBed.configureTestingModule({ providers: [{ provide: SupabaseService, useValue: fake.supabase }, { provide: RiderWorkspaceService, useValue: workspace }] });
    return { service: TestBed.inject(RiderService), fake };
  }

  it("reads the rider's own row for the current business", async () => {
    const { service, fake } = setup();
    expect(await service.getProfile('rider-1')).toMatchObject({ riderId: 'rider-row-1', displayName: 'Sagar Pawar', phoneNumber: '+91 98220 33333', verification: 'verified' });
    expect(fake.calls[0]).toMatchObject({ kind: 'select', name: 'riders', filters: [['tenant_id', 'tenant-1'], ['user_id', 'rider-1']] });
    expect(await service.getVehicle('rider-1')).toEqual({ vehicleType: 'scooter', vehicleNumber: 'MH12AB1234' });
    expect(await service.getBankDetails('rider-1')).toEqual({ upiId: 'sagar@upi' });
  });

  it('has no profile before the first save', async () => {
    const { service } = setup(null);
    expect(await service.getProfile('rider-1')).toBeNull();
    expect(await service.getVehicle('rider-1')).toBeNull();
  });

  it('creates the row on the first personal-information save', async () => {
    const { service, fake } = setup(null);
    await service.savePersonalInfo('rider-1', personalInfo);
    expect(fake.calls.find((c) => c.kind === 'insert')?.args).toEqual({ full_name: 'Sagar Pawar', phone: '9822033333', licence_number: 'MH1220200012345', tenant_id: 'tenant-1', user_id: 'rider-1' });
  });

  it('updates the existing row afterwards', async () => {
    const { service, fake } = setup();
    await service.savePersonalInfo('rider-1', personalInfo);
    expect(fake.calls.find((c) => c.kind === 'update')).toMatchObject({ args: { full_name: 'Sagar Pawar' }, filters: [['id', 'rider-row-1']] });
  });

  it('saves vehicle and UPI on the existing row', async () => {
    const { service, fake } = setup();
    await service.saveVehicle('rider-1', { vehicleType: 'motorcycle', vehicleNumber: ' mh12cd5678 ' });
    await service.saveBankDetails('rider-1', { upiId: 'sagar@okbank' });
    expect(fake.calls.filter((c) => c.kind === 'update').map((c) => c.args)).toEqual([{ vehicle_type: 'motorcycle', vehicle_number: 'MH12CD5678' }, { upi_id: 'sagar@okbank' }]);
  });

  it('asks for personal information before vehicle or UPI', async () => {
    const { service } = setup(null);
    await expect(service.saveBankDetails('rider-1', { upiId: 'a@b' })).rejects.toThrowError(ERROR_MESSAGES.PROFILE_FIRST);
  });

  it('goes online and reports position for the current business', async () => {
    const { service, fake } = setup();
    await service.setOnline(true);
    await service.reportLocation({ lat: 18.56, lng: 73.77 }, 'job-1');
    expect(fake.calls.map((c) => [c.name, c.args])).toEqual([
      ['set_rider_online', { p_tenant: 'tenant-1', p_online: true }],
      ['report_rider_location', { p_tenant: 'tenant-1', p_lat: 18.56, p_lng: 73.77, p_job: 'job-1' }],
    ]);
  });

  it('documents are not connected until the Storage bucket exists', async () => {
    const { service } = setup();
    await expect(service.saveDocuments('rider-1', { profile: '', drivingLicence: '', nationalId: '' })).rejects.toSatisfy(isNotImplemented);
  });
});
