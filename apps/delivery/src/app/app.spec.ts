import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from '@app/app';

describe('App', () => {
  it('renders the Ionic app shell without hydrating it', () => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const ionApp = fixture.nativeElement.querySelector('ion-app') as HTMLElement;
    expect(ionApp.hasAttribute('ngskiphydration')).toBe(true);
    expect(ionApp.querySelector('ion-router-outlet')).not.toBeNull();
  });
});
