import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiAuthInterceptor } from '@interceptors/api-auth/api-auth.interceptor';
import { AuthService } from '@services/auth/auth.service';
import { TEST_SESSION, createSupabaseMock, provideSupabase } from '@testing/supabase.mock';

describe('apiAuthInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiAuthInterceptor])), provideHttpClientTesting(), provideSupabase(createSupabaseMock(TEST_SESSION).client)],
    });
    await TestBed.inject(AuthService).ready;
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the Bearer token to our backend', () => {
    http.get('http://localhost:4000/geocode/search').subscribe();
    expect(backend.expectOne('http://localhost:4000/geocode/search').request.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('never sends it to third-party URLs', () => {
    http.get('https://tiles.example.com/1/2/3.png').subscribe();
    expect(backend.expectOne('https://tiles.example.com/1/2/3.png').request.headers.has('Authorization')).toBe(false);
  });
});
