import { routes } from '@app/app.routes';
import { serverRoutes } from '@app/app.routes.server';
import { RenderMode } from '@angular/ssr';
import { authGuard } from '@guards/auth/auth.guard';

describe('app routes', () => {
  it('keeps the old URLs', () => {
    const top = routes.map((r) => r.path);
    expect(top).toEqual(['', 'register', 'forget', 'login', 'main', 'phonenumber', 'location', 'otp']);
    const main = routes.find((r) => r.path === 'main');
    expect(main?.children?.map((r) => r.path)).toEqual(['', 'home', 'account', 'table', 'foods', 'food-review', 'confirm-order', 'track', 'add-cart', 'account-information', 'change-password', 'payment-method', 'table-details', 'histroy', 'table-confirm']);
  });

  it('guards the signed-in screens and lazy-loads every screen', () => {
    for (const path of ['main', 'phonenumber', 'location', 'otp']) expect(routes.find((r) => r.path === path)?.canActivate).toEqual([authGuard]);
    for (const route of routes.filter((r) => !r.redirectTo)) expect(route.loadComponent).toBeTypeOf('function');
  });

  it('renders user-specific screens in the browser and the rest on the server', () => {
    expect(serverRoutes.find((r) => r.path === 'main/add-cart')?.renderMode).toBe(RenderMode.Client);
    expect(serverRoutes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Server });
  });
});
