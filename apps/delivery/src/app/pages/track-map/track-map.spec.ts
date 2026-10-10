import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { submit } from '@angular/forms/signals';
import { TrackMap } from '@pages/track-map/track-map';
import { TrackingService } from '@services/tracking/tracking.service';
import { OrdersService } from '@services/orders/orders.service';
import { ShiftService } from '@services/shift/shift.service';
import { AlertService } from '@services/alert/alert.service';
import { LocationService } from '@services/location/location.service';
import { NavigationService } from '@services/navigation/navigation.service';
import { RiderOrder } from '@appTypes/order.types';
import { deliveryJobRow } from '@testing/delivery-fixtures';
import { toRiderOrder } from '@utils/delivery-job/delivery-job.util';
import { TRACK_MAP_PAGE } from '@constants/track-map.constants';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';

describe('TrackMap', () => {
  const getActiveDelivery = vi.fn();
  const orders = { advance: vi.fn(), complete: vi.fn(), fail: vi.fn() };
  const alerts = { presentError: vi.fn(), presentAlert: vi.fn() };
  const navigation = { root: vi.fn() };
  const job = (status = 'picked_up', overrides = {}): RiderOrder => toRiderOrder(deliveryJobRow({ status, ...overrides }));

  function create() {
    const shift = { jobsVersion: signal(0), setActiveJob: vi.fn(), jobsChanged: vi.fn() };
    TestBed.configureTestingModule({
      imports: [TrackMap],
      providers: [
        provideRouter([]),
        { provide: TrackingService, useValue: { getActiveDelivery } },
        { provide: OrdersService, useValue: orders },
        { provide: ShiftService, useValue: shift },
        { provide: AlertService, useValue: alerts },
        { provide: LocationService, useValue: { getCurrentPosition: vi.fn(async () => ({ lat: 18.56, lng: 73.77, accuracy: 5, timestamp: 1 })) } },
        { provide: NavigationService, useValue: navigation },
      ],
    });
    const fixture = TestBed.createComponent(TrackMap);
    fixture.detectChanges();
    return { fixture, shift };
  }

  async function settle(fixture: ReturnType<typeof create>['fixture']) {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    getActiveDelivery.mockReset().mockResolvedValue(null);
    Object.values(orders).forEach((fn) => fn.mockReset().mockResolvedValue(undefined));
    Object.values(alerts).forEach((fn) => fn.mockReset());
    navigation.root.mockReset();
  });

  it('shows the empty state when there is no delivery', async () => {
    const { fixture } = create();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('[data-testid="track-empty"]')).not.toBeNull();
  });

  it('shows the job with navigate and call links, and follows it for position reports', async () => {
    getActiveDelivery.mockResolvedValue(job('assigned'));
    const { fixture, shift } = create();
    await settle(fixture);
    const el: HTMLElement = fixture.nativeElement;
    expect(fixture.componentInstance.initial()).toBe('M');
    expect(el.textContent).toContain('Flat 4, Balewadi High Street');
    expect(el.querySelector('[data-testid="nav-pickup"]')?.getAttribute('href')).toBe('geo:18.559,73.7867?q=18.559,73.7867');
    expect(el.querySelector('[data-testid="call-customer"]')?.getAttribute('href')).toBe('tel:+919000000001');
    expect(el.querySelector('[data-testid="track-cod"]')).not.toBeNull();
    expect(shift.setActiveJob).toHaveBeenLastCalledWith('job-1');
  });

  it('moves the job to its next step with the position', async () => {
    getActiveDelivery.mockResolvedValue(job('assigned'));
    const { fixture, shift } = create();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('[data-testid="track-next"]').textContent).toContain(TRACK_MAP_PAGE.NEXT_STEP.assigned?.label);
    expect(fixture.nativeElement.querySelector('[data-testid="track-deliver"]')).toBeNull();
    await fixture.componentInstance.advance();
    expect(orders.advance).toHaveBeenCalledWith('job-1', 'at_pickup', { lat: 18.56, lng: 73.77 });
    expect(shift.jobsChanged).toHaveBeenCalled();
  });

  it('hands over with OTP and cash, then goes back to the orders', async () => {
    getActiveDelivery.mockResolvedValue(job('at_drop'));
    const { fixture } = create();
    await settle(fixture);
    fixture.componentInstance.openDeliver();
    fixture.componentInstance.deliverForm.otp().value.set('4821');
    expect(fixture.componentInstance.deliverForm.cash().value()).toBe('230');
    await submit(fixture.componentInstance.deliverForm);
    await settle(fixture);
    expect(orders.complete).toHaveBeenCalledWith('job-1', { otp: '4821', photoUrl: null, codCollected: 230, position: { lat: 18.56, lng: 73.77 } });
    expect(alerts.presentAlert).toHaveBeenCalledWith(TRACK_MAP_PAGE.ALERT_TITLE, TRACK_MAP_PAGE.DELIVERED_MESSAGE, 'success');
    expect(navigation.root).toHaveBeenCalledWith(APP_ROUTE_LINKS.ORDER);
  });

  it('does not submit without a 4-digit OTP', async () => {
    getActiveDelivery.mockResolvedValue(job('picked_up'));
    const { fixture } = create();
    await settle(fixture);
    fixture.componentInstance.openDeliver();
    fixture.componentInstance.deliverForm.otp().value.set('12');
    expect(fixture.componentInstance.deliverForm().valid()).toBe(false);
  });

  it("shows the server's refusal (wrong OTP) and stays on the form", async () => {
    getActiveDelivery.mockResolvedValue(job('at_drop', { cod_amount: 0 }));
    orders.complete.mockRejectedValue(new Error('Wrong OTP'));
    const { fixture } = create();
    await settle(fixture);
    fixture.componentInstance.openDeliver();
    fixture.componentInstance.deliverForm.otp().value.set('0000');
    await submit(fixture.componentInstance.deliverForm);
    expect(alerts.presentError).toHaveBeenCalledWith(TRACK_MAP_PAGE.ALERT_TITLE, expect.any(Error));
    expect(fixture.componentInstance.panel()).toBe('deliver');
    expect(orders.complete.mock.calls[0]?.[1]).toMatchObject({ codCollected: null });
  });

  it('returns the order to the restaurant with a reason', async () => {
    getActiveDelivery.mockResolvedValue(job('at_drop'));
    const { fixture } = create();
    await settle(fixture);
    fixture.componentInstance.openFail();
    fixture.componentInstance.failForm.reason().value.set(TRACK_MAP_PAGE.FAIL_REASONS[0].value);
    await submit(fixture.componentInstance.failForm);
    expect(orders.fail).toHaveBeenCalledWith('job-1', { reason: TRACK_MAP_PAGE.FAIL_REASONS[0].value, photoUrl: null, position: { lat: 18.56, lng: 73.77 } });
    expect(alerts.presentAlert).toHaveBeenCalledWith(TRACK_MAP_PAGE.ALERT_TITLE, TRACK_MAP_PAGE.FAILED_MESSAGE, 'success');
  });

  it('toggles between the details card and the map', () => {
    const { fixture } = create();
    fixture.componentInstance.toggleDetails();
    expect(fixture.componentInstance.showDetails()).toBe(false);
  });
});
