import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SUPABASE, SupabaseNotConfiguredError, isSupabaseConfigured } from '@services/supabase/supabase.service';

describe('SUPABASE client loader', () => {
  it('lazily creates one client in the browser when the environment is configured', async () => {
    expect(isSupabaseConfigured()).toBe(true);
    const load = TestBed.inject(SUPABASE);
    const client = await load();
    expect(client).not.toBeNull();
    expect(await load()).toBe(client);
  });

  it('has no client at all during server rendering', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    await expect(TestBed.inject(SUPABASE)()).resolves.toBeNull();
  });

  it('explains a missing configuration', () => {
    const error = new SupabaseNotConfiguredError();
    expect(error.name).toBe('SupabaseNotConfiguredError');
    expect(error.message).toContain('Supabase is not configured for the "development" environment');
  });
});
