import { TestBed } from '@angular/core/testing';
import { Loader } from '@components/loader/loader';

describe('Loader', () => {
  it('renders an accessible busy overlay', () => {
    const fixture = TestBed.createComponent(Loader);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"] .spinner')).not.toBeNull();
  });
});
