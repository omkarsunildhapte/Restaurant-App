import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { Login } from '@pages/login/login';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TEST_USER } from '@testing/supabase.mock';
import { renderPage, settle } from '@testing/test-providers';

describe('Login', () => {
  it('renders the sign-in form', async () => {
    const { element } = await renderPage(Login, { session: null });
    expect(element.textContent).toContain('Login');
    expect(element.querySelectorAll('ion-input').length).toBe(2);
  });

  it('does not submit an empty form and shows validation messages', async () => {
    const { fixture, element, supabase } = await renderPage(Login, { session: null });
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Email is required.');
  });

  it('signs in and goes to add a phone number when the user has none', async () => {
    const { fixture, supabase, ui } = await renderPage(Login, { session: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: TEST_USER, session: null }, error: null });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.loginForm.email().value.set('test@example.com');
    fixture.componentInstance.loginForm.password().value.set('secret1');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'secret1' });
    expect(ui.alerts.present).toHaveBeenCalledWith('Login', 'Login Successfully', 'success');
    expect(navigate).toHaveBeenCalledWith(APP_ROUTE_LINKS.PHONE_NUMBER);
  });

  it('shows the Supabase error when sign-in fails', async () => {
    const { fixture, supabase, ui } = await renderPage(Login, { session: null });
    supabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'Invalid login credentials' } });
    fixture.componentInstance.loginForm.email().value.set('test@example.com');
    fixture.componentInstance.loginForm.password().value.set('wrong');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(ui.alerts.present).toHaveBeenCalledWith('Login Failed', 'Invalid login credentials', 'error');
  });
});
