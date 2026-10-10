import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TrackMap } from '@pages/track-map/track-map';
import { TrackingService } from '@services/tracking/tracking.service';

describe('TrackMap', () => {
  const getActiveDelivery = vi.fn();

  function create() {
    TestBed.configureTestingModule({ imports: [TrackMap], providers: [provideRouter([]), { provide: TrackingService, useValue: { getActiveDelivery } }] });
    const fixture = TestBed.createComponent(TrackMap);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => getActiveDelivery.mockReset().mockResolvedValue(null));

  it('shows the empty state while there is no delivery (stub)', async () => {
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="track-empty"]')).not.toBeNull();
  });

  it('shows the delivery card when there is one', async () => {
    getActiveDelivery.mockResolvedValue({ customerName: 'aman', customerPhone: '0145425765', deliveryAddress: 'Andheri' });
    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.initial()).toBe('A');
    expect(fixture.nativeElement.textContent).toContain('Andheri');
  });

  it('toggles between the details card and the map', () => {
    const fixture = create();
    fixture.componentInstance.toggleDetails();
    expect(fixture.componentInstance.showDetails()).toBe(false);
  });
});
