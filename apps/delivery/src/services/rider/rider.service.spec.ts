import { TestBed } from '@angular/core/testing';
import { RiderService } from '@services/rider/rider.service';
import { SupabaseService } from '@services/supabase/supabase.service';
import { RiderWorkspaceService } from '@services/rider-workspace/rider-workspace.service';
import { fakeDataClient, riderRow } from '@testing/delivery-fixtures';
import { ERROR_MESSAGES } from '@constants/messages.constants';
import { PERSONAL_INFORMATION_PAGE } from '@constants/personal-information.constants';

const personalInfo = { ...PERSONAL_INFORMATION_PAGE.EMPTY_FORM, firstName: 'Sagar', lastName: 'Pawar', fathersName: 'Ramesh Pawar', dateOfBirth: '1998-04-12', mobileNumber: '9822033333', bloodGroup: 'O+', city: 'Pune', address: 'Baner', deliveryLicenseId: 'MH1220200012345', nationalId: '1234 5678 9012' };
const details = { rider_id: 'rider-row-1', date_of_birth: '1998-04-12', address: 'Baner', city: 'Pune', fathers_name: 'Ramesh Pawar', blood_group: 'O+', national_id: '1234 5678 9012' };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('RiderService', () => {
  function setup(row: ReturnType<typeof riderRow> | null = riderRow(), riderDetails: typeof details | null = details) {
    const fake = fakeDataClient({ riders: { data: row, error: null }, 'insert:riders': { data: { id: 'new-row' }, error: null }, rider_details: { data: riderDetails, error: null } });
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
    const { service } = setup(null, null);
    expect(await service.getProfile('rider-1')).toBeNull();
    expect(await service.getPersonalInfo('rider-1')).toBeNull();
    expect(await service.getVehicle('rider-1')).toBeNull();
  });

  it('reads personal information back with the national ID as its last 4 only', async () => {
    const { service } = setup();
    expect(await service.getPersonalInfo('rider-1')).toEqual({
      info: { firstName: 'Sagar', lastName: 'Pawar', fathersName: 'Ramesh Pawar', dateOfBirth: '1998-04-12', mobileNumber: '+91 98220 33333', bloodGroup: 'O+', city: 'Pune', address: 'Baner', deliveryLicenseId: 'MH1220200012345', nationalId: '' },
      nationalIdLast4: '9012',
    });
  });

  it('creates the riders row and the rider-only details on the first save', async () => {
    const { service, fake } = setup(null, null);
    await service.savePersonalInfo('rider-1', personalInfo);
    const inserts = fake.calls.filter((c) => c.kind === 'insert');
    expect(inserts[0]).toMatchObject({ name: 'riders', args: { full_name: 'Sagar Pawar', phone: '9822033333', licence_number: 'MH1220200012345', tenant_id: 'tenant-1', user_id: 'rider-1' } });
    expect(inserts[1]).toMatchObject({ name: 'rider_details', args: { rider_id: 'new-row', tenant_id: 'tenant-1', national_id: '1234 5678 9012', blood_group: 'O+' } });
  });

  it('updates both tables afterwards, keeping the saved national ID when the field is left empty', async () => {
    const { service, fake } = setup();
    await service.savePersonalInfo('rider-1', { ...personalInfo, nationalId: '' });
    const updates = fake.calls.filter((c) => c.kind === 'update');
    expect(updates[0]).toMatchObject({ name: 'riders', args: { full_name: 'Sagar Pawar' }, filters: [['id', 'rider-row-1']] });
    expect(updates[1]).toMatchObject({ name: 'rider_details', filters: [['rider_id', 'rider-row-1']] });
    expect(updates[1]?.args).toEqual({ date_of_birth: '1998-04-12', address: 'Baner', city: 'Pune', fathers_name: 'Ramesh Pawar', blood_group: 'O+' });
  });

  it("uploads newly picked photos into the rider's folder and records the paths", async () => {
    const { service, fake } = setup();
    await service.saveDocuments('rider-1', { profile: PNG, drivingLicence: 'https://signed.test/old', nationalId: '' });
    const uploads = fake.calls.filter((c) => c.kind === 'upload');
    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({ name: 'rider-documents', args: { path: 'tenant-1/rider-1/photo.jpg', options: { upsert: true } } });
    expect(fake.calls.find((c) => c.kind === 'update')?.args).toEqual({ photo_url: 'tenant-1/rider-1/photo.jpg' });
  });

  it('shows saved photos through signed URLs', async () => {
    const { service } = setup(riderRow({ photo_url: 'tenant-1/rider-1/photo.jpg' }));
    expect(await service.getDocuments('rider-1')).toEqual({ profile: 'https://signed.test/tenant-1/rider-1/photo.jpg', drivingLicence: '', nationalId: '' });
  });

  it('saves vehicle and UPI on the existing row', async () => {
    const { service, fake } = setup();
    await service.saveVehicle('rider-1', { vehicleType: 'motorcycle', vehicleNumber: ' mh12cd5678 ' });
    await service.saveBankDetails('rider-1', { upiId: 'sagar@okbank' });
    expect(fake.calls.filter((c) => c.kind === 'update').map((c) => c.args)).toEqual([{ vehicle_type: 'motorcycle', vehicle_number: 'MH12CD5678' }, { upi_id: 'sagar@okbank' }]);
  });

  it('asks for personal information before vehicle, UPI or documents', async () => {
    const { service } = setup(null, null);
    await expect(service.saveBankDetails('rider-1', { upiId: 'a@b' })).rejects.toThrowError(ERROR_MESSAGES.PROFILE_FIRST);
    await expect(service.saveDocuments('rider-1', { profile: PNG, drivingLicence: '', nationalId: '' })).rejects.toThrowError(ERROR_MESSAGES.PROFILE_FIRST);
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
});
