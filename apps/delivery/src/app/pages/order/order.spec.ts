import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { SegmentCustomEvent } from '@ionic/angular';
import { Order } from '@pages/order/order';
import { OrdersService } from '@services/orders/orders.service';
import { ORDER_PAGE } from '@constants/order.constants';

describe('Order', () => {
  const listOrders = vi.fn();

  function create() {
    TestBed.configureTestingModule({ imports: [Order], providers: [provideRouter([]), { provide: OrdersService, useValue: { listOrders } }] });
    const fixture = TestBed.createComponent(Order);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => listOrders.mockReset().mockResolvedValue([]));

  it('shows the empty state for the active tab', async () => {
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(listOrders).toHaveBeenCalledWith('active');
    expect(fixture.nativeElement.querySelector('[data-testid="order-empty"]').textContent).toContain(ORDER_PAGE.SEGMENTS[0].emptyText);
  });

  it('reloads when the segment changes and ignores unknown values', async () => {
    const fixture = create();
    fixture.componentInstance.onSegmentChange({ detail: { value: 'history' } } as SegmentCustomEvent);
    await fixture.whenStable();
    expect(listOrders).toHaveBeenLastCalledWith('history');
    fixture.componentInstance.onSegmentChange({ detail: { value: 'nope' } } as SegmentCustomEvent);
    expect(fixture.componentInstance.segment()).toBe('history');
  });

  it('lists the orders it gets', async () => {
    listOrders.mockResolvedValue([{ id: 'job-1', status: 'assigned', deliveryAddress: 'Andheri', codAmount: 250 }]);
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(ORDER_PAGE.STATUS_LABELS.assigned);
    expect(fixture.nativeElement.textContent).toContain('Andheri');
  });
});
