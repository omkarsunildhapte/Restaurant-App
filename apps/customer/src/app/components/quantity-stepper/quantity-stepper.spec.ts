import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/provide';
import { QuantityStepper } from '@components/quantity-stepper/quantity-stepper';

describe('QuantityStepper', () => {
  it('shows the value and emits -1 / +1', async () => {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(QuantityStepper);
    fixture.componentRef.setInput('value', 3);
    fixture.componentRef.setInput('label', 'Lassi');
    const changes: number[] = [];
    fixture.componentInstance.changed.subscribe((d) => changes.push(d));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.value')?.textContent).toBe('3');
    const [minus, plus] = Array.from(element.querySelectorAll('button'));
    expect(minus.getAttribute('aria-label')).toBe('Decrease Lassi');
    minus.click();
    plus.click();
    expect(changes).toEqual([-1, 1]);
  });
});
