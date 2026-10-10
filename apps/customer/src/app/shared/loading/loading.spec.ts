import { TestBed } from '@angular/core/testing';
import { Loading } from '@shared/loading/loading';

describe('Loading', () => {
  it('renders an accessible progress overlay', () => {
    const fixture = TestBed.createComponent(Loading);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="progressbar"]')).not.toBeNull();
  });
});
