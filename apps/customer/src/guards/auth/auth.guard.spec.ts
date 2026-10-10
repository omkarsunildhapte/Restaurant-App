import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from '@guards/auth/auth.guard';
import { TEST_SESSION, createSupabaseMock, provideSupabase } from '@testing/supabase.mock';

const run = () => TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

describe('authGuard', () => {
  it('lets a signed-in user through', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideSupabase(createSupabaseMock(TEST_SESSION).client)] });
    await expect(run()).resolves.toBe(true);
  });

  it('sends a signed-out user to /login', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideSupabase(createSupabaseMock(null).client)] });
    const result = (await run()) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });

  it('lets the server render (the session lives in the browser)', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: 'server' }, provideSupabase(null)] });
    await expect(run()).resolves.toBe(true);
  });
});
