import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/provide';
import { AuthShell } from '@shared/auth-shell/auth-shell';

describe('AuthShell', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideIonicAngular()] }));

  it('shows the logo and title', async () => {
    const fixture = TestBed.createComponent(AuthShell);
    fixture.componentRef.setInput('title', 'Login');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('img.auth-logo')?.getAttribute('alt')).toBe('Thaliyo');
    expect(element.textContent).toContain('Login');
    expect(element.querySelector('app-loading')).toBeNull();
  });

  it('shows the loading overlay while busy', async () => {
    const fixture = TestBed.createComponent(AuthShell);
    fixture.componentRef.setInput('title', 'Login');
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelector('app-loading')).not.toBeNull();
  });
});
