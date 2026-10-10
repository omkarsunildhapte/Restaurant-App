import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from '@guards/auth/auth.guard';
import { AuthService } from '@services/auth/auth.service';
import { fakeAuthService, fakeSession } from '@testing/doubles';

function run(auth: ReturnType<typeof fakeAuthService>, platform = 'browser') {
  TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }, { provide: PLATFORM_ID, useValue: platform }] });
  return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
}

describe('authGuard', () => {
  it('lets a rider with a session through', async () => {
    await expect(run(fakeAuthService(fakeSession()))).resolves.toBe(true);
  });

  it('sends a rider without a session to /login and clears the legacy keys', async () => {
    const auth = fakeAuthService(null);
    const result = (await run(auth)) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
    expect(auth.clearLegacyState).toHaveBeenCalled();
  });

  it('lets the server render through (the session lives in the browser)', async () => {
    const auth = fakeAuthService(null);
    await expect(run(auth, 'server')).resolves.toBe(true);
    expect(auth.getSession).not.toHaveBeenCalled();
  });
});
