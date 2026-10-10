import { EnvironmentProviders, Provider, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideIonicAngular } from '@ionic/angular/provide';
import type { Session } from '@supabase/supabase-js';
import { vi } from 'vitest';
import { AlertService } from '@services/alert/alert.service';
import { ToastService } from '@services/toast/toast.service';
import { TEST_SESSION, createSupabaseMock, provideSupabase } from '@testing/supabase.mock';

/** Alert/Toast doubles (Ionic overlays don't render in jsdom). */
export function createUiMocks() {
  return {
    alerts: { present: vi.fn().mockResolvedValue(undefined) },
    toast: { show: vi.fn().mockResolvedValue(undefined), notConnected: vi.fn().mockResolvedValue(undefined) },
  };
}

export interface PageTestOptions {
  /** Signed-in session for AuthService (default: signed in). Pass null for signed out. */
  session?: Session | null;
  providers?: (Provider | EnvironmentProviders)[];
}

/**
 * Renders a standalone screen with the app's providers: router, Ionic, HttpClient testing,
 * a mocked Supabase client (no network) and mocked alerts/toasts.
 */
export async function renderPage<T>(component: Type<T>, options: PageTestOptions = {}) {
  const supabase = createSupabaseMock(options.session === undefined ? TEST_SESSION : options.session);
  const ui = createUiMocks();
  TestBed.configureTestingModule({
    imports: [component],
    providers: [
      provideRouter([]),
      provideIonicAngular(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideSupabase(supabase.client),
      { provide: AlertService, useValue: ui.alerts },
      { provide: ToastService, useValue: ui.toast },
      ...(options.providers ?? []),
    ],
  });
  const fixture: ComponentFixture<T> = TestBed.createComponent(component);
  await fixture.whenStable();
  return { fixture, element: fixture.nativeElement as HTMLElement, supabase, ui };
}

/** Lets pending resource() loaders settle and re-renders. */
export async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}

/** Lets microtasks run and re-renders without waiting for pending HTTP requests (unlike whenStable). */
export async function tick<T>(fixture: ComponentFixture<T>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  fixture.detectChanges();
}
