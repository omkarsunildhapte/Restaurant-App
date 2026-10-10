import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { submit } from '@angular/forms/signals';
import { VehicleDetails } from '@pages/vehicle-details/vehicle-details';
import { AuthService } from '@services/auth/auth.service';
import { RiderService } from '@services/rider/rider.service';
import { AlertService } from '@services/alert/alert.service';
import { NotImplementedError } from '@utils/errors/errors.util';
import { VEHICLE_DETAILS_PAGE } from '@constants/vehicle-details.constants';
import { fakeAlertService, fakeAuthService } from '@testing/doubles';

describe('VehicleDetails', () => {
  let alerts: ReturnType<typeof fakeAlertService>;
  const getVehicle = vi.fn();
  const saveVehicle = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [VehicleDetails],
      providers: [provideRouter([]), { provide: AuthService, useValue: fakeAuthService() }, { provide: RiderService, useValue: { getVehicle, saveVehicle } }, { provide: AlertService, useValue: alerts }],
    });
    const fixture = TestBed.createComponent(VehicleDetails);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    alerts = fakeAlertService();
    getVehicle.mockResolvedValue(null);
    saveVehicle.mockReset();
  });

  it('pre-fills the form from the saved vehicle', async () => {
    getVehicle.mockResolvedValue({ vehicleType: 'motorcycle', vehicleNumber: 'MH01AB1234' });
    const fixture = create();
    await fixture.whenStable();
    expect(getVehicle).toHaveBeenCalledWith('rider-1');
    expect(fixture.componentInstance.vehicleForm.vehicleNumber().value()).toBe('MH01AB1234');
  });

  it('starts empty when nothing is saved (stub)', async () => {
    const fixture = create();
    await fixture.whenStable();
    expect(fixture.componentInstance.vehicleForm().value()).toEqual(VEHICLE_DETAILS_PAGE.EMPTY_FORM);
  });

  it('toasts "Not connected yet" on save', async () => {
    const error = new NotImplementedError('save');
    saveVehicle.mockRejectedValue(error);
    const fixture = create();
    await fixture.whenStable();
    fixture.componentInstance.vehicleForm.vehicleType().value.set('scooter');
    fixture.componentInstance.vehicleForm.vehicleNumber().value.set('MH01');
    await submit(fixture.componentInstance.vehicleForm);
    expect(alerts.saveFailed).toHaveBeenCalledWith(VEHICLE_DETAILS_PAGE.ALERT_TITLE, error);
  });

  it('renders one option per vehicle type', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelectorAll('ion-select-option').length).toBe(VEHICLE_DETAILS_PAGE.VEHICLE_TYPES.length);
  });
});
