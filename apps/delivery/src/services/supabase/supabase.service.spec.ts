import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SupabaseService } from '@services/supabase/supabase.service';
import { ERROR_MESSAGES } from '@constants/messages.constants';

describe('SupabaseService', () => {
  it('creates a client in the browser when the environment has url and anonKey', () => {
    const service = TestBed.inject(SupabaseService);
    expect(service.configError).toBeNull();
    expect(service.client).not.toBeNull();
    expect(service.require()).toBe(service.client);
  });

  it('creates no client during SSR and explains why', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const service = TestBed.inject(SupabaseService);
    expect(service.client).toBeNull();
    expect(() => service.require()).toThrowError(ERROR_MESSAGES.SUPABASE_SERVER);
  });
});
