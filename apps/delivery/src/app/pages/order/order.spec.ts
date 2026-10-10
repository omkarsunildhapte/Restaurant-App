import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import type { SegmentCustomEvent, ToggleCustomEvent } from '@ionic/angular';
import { Order } from '@pages/order/order';
import { OrdersService } from '@services/orders/orders.service';
import { ShiftService } from '@services/shift/shift.service';
import { AlertService } from '@services/alert/alert.service';
import { OnlineBlock } from '@appTypes/rider.types';
import { ORDER_PAGE } from '@constants/order.constants';
import { SHIFT } from '@constants/shift.constants';
import { deliveryJobRow } from '@testing/delivery-fixtures';
import { toRiderOrder } from '@utils/delivery-job/delivery-job.util';

describe('Order', () => {
  const listOrders = vi.fn();
  const accept = vi.fn();
  const reject = vi.fn();
  const presentError = vi.fn();

  function create(block: OnlineBlock = null) {
    const shift = {
      jobsVersion: signal(0),
      online: signal(false),
      busy: signal(false),
      error: signal<string | null>(null),
      block: signal<OnlineBlock>(block),
      profile: signal(null),
      start: vi.fn(async () => undefined),
      goOnline: vi.fn(async () => undefined),
      goOffline: vi.fn(async () => undefined),
      jobsChanged: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [Order],
      providers: [provideRouter([]), { provide: OrdersService, useValue: { listOrders, accept, reject } }, { provide: ShiftService, useValue: shift }, { provide: AlertService, useValue: { presentError } }],
    });
    const fixture = TestBed.createComponent(Order);
    fixture.detectChanges();
    return { fixture, shift };
  }

  async function settle(fixture: ReturnType<typeof create>['fixture']) {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    listOrders.mockReset().mockResolvedValue([]);
    accept.mockReset().mockResolvedValue('assigned');
    reject.mockReset().mockResolvedValue('cancelled');
    presentError.mockReset();
  });

  it('shows the empty state for the active tab and starts the shift', async () => {
    const { fixture, shift } = create();
    await settle(fixture);
    expect(shift.start).toHaveBeenCalled();
    expect(listOrders).toHaveBeenCalledWith('active');
    expect(fixture.nativeElement.querySelector('[data-testid="order-empty"]').textContent).toContain(ORDER_PAGE.SEGMENTS[0].emptyText);
  });

  it('reloads when the segment changes and ignores unknown values', async () => {
    const { fixture } = create();
    fixture.componentInstance.onSegmentChange({ detail: { value: 'history' } } as SegmentCustomEvent);
    await fixture.whenStable();
    expect(listOrders).toHaveBeenLastCalledWith('history');
    fixture.componentInstance.onSegmentChange({ detail: { value: 'nope' } } as SegmentCustomEvent);
    expect(fixture.componentInstance.segment()).toBe('history');
  });

  it('reloads when a job changes (Realtime)', async () => {
    const { fixture, shift } = create();
    await settle(fixture);
    shift.jobsVersion.set(1);
    await settle(fixture);
    expect(listOrders).toHaveBeenCalledTimes(2);
  });

  it('accepts and rejects an offer', async () => {
    listOrders.mockResolvedValue([toRiderOrder(deliveryJobRow({ status: 'offered' }))]);
    const { fixture, shift } = create();
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain(ORDER_PAGE.STATUS_LABELS.offered);
    fixture.nativeElement.querySelector('[data-testid="job-accept"]').click();
    await settle(fixture);
    expect(accept).toHaveBeenCalledWith('job-1');
    expect(shift.jobsChanged).toHaveBeenCalled();
    fixture.nativeElement.querySelector('[data-testid="job-reject"]').click();
    await settle(fixture);
    expect(reject).toHaveBeenCalledWith('job-1', ORDER_PAGE.REJECT_REASON);
  });

  it('shows why accepting failed', async () => {
    accept.mockRejectedValue(new Error('This job is already cancelled'));
    const order = toRiderOrder(deliveryJobRow({ status: 'offered' }));
    const { fixture } = create();
    await fixture.componentInstance.accept(order);
    expect(presentError).toHaveBeenCalledWith(ORDER_PAGE.ALERT_TITLE, expect.any(Error));
  });

  it('opens a job in progress on the track page', async () => {
    listOrders.mockResolvedValue([toRiderOrder(deliveryJobRow({ status: 'picked_up' }))]);
    const { fixture } = create();
    await settle(fixture);
    expect(fixture.nativeElement.querySelector('[data-testid="job-open"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('#17');
  });

  it('switches online and offline', () => {
    const { fixture, shift } = create();
    fixture.componentInstance.onOnlineChange({ detail: { checked: true } } as ToggleCustomEvent);
    fixture.componentInstance.onOnlineChange({ detail: { checked: false } } as ToggleCustomEvent);
    expect(shift.goOnline).toHaveBeenCalled();
    expect(shift.goOffline).toHaveBeenCalled();
  });

  it('explains why the rider cannot go online yet', () => {
    const { fixture } = create('not-verified');
    expect(fixture.nativeElement.querySelector('[data-testid="online-block"]').textContent).toContain(SHIFT.NOT_VERIFIED);
  });
});
