import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { authTokenInterceptor } from '@interceptors/auth-token/auth-token.interceptor';
import { AuthService } from '@services/auth/auth.service';
import { AUTH_HEADER } from '@constants/http.constants';
import { fakeAuthService, fakeSession } from '@testing/doubles';

describe('authTokenInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: ReturnType<typeof fakeAuthService>;

  beforeEach(() => {
    auth = fakeAuthService(fakeSession({ token: 'abc' }));
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authTokenInterceptor])), provideHttpClientTesting(), { provide: AuthService, useValue: auth }],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the Bearer token to API requests', () => {
    http.get(`${environment.apiUrl}/geocode/search`).subscribe();
    expect(controller.expectOne(`${environment.apiUrl}/geocode/search`).request.headers.get(AUTH_HEADER)).toBe('Bearer abc');
  });

  it('never sends it to another host', () => {
    http.get('https://tiles.example.com/1.png').subscribe();
    expect(controller.expectOne('https://tiles.example.com/1.png').request.headers.has(AUTH_HEADER)).toBe(false);
  });

  it('sends nothing when signed out', () => {
    auth.state.set(null);
    http.get(`${environment.apiUrl}/x`).subscribe();
    expect(controller.expectOne(`${environment.apiUrl}/x`).request.headers.has(AUTH_HEADER)).toBe(false);
  });
});
