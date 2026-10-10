import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Register } from '@pages/register/register';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { renderPage, settle } from '@testing/test-providers';

describe('Register', () => {
  async function fill(password = 'secret1', confirm = 'secret1') {
    const page = await renderPage(Register, { session: null });
    const f = page.fixture.componentInstance.registerForm;
    f.name().value.set('Asha');
    f.email().value.set('asha@example.com');
    f.password().value.set(password);
    f.confirmPassword().value.set(confirm);
    return page;
  }

  it('blocks mismatched passwords', async () => {
    const { fixture, element, supabase } = await fill('secret1', 'other12');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Passwords must match.');
  });

  it('signs up and returns to login', async () => {
    const { fixture, element, supabase, ui } = await fill();
    supabase.auth.signUp.mockResolvedValue({ data: { user: {} }, error: null });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith(APP_ROUTE_LINKS.LOGIN);
    expect(ui.alerts.present).toHaveBeenCalledWith('Registration Success', 'The Account Created Successfully', 'success');
  });

  it('explains an email that is already registered', async () => {
    const { fixture, element, supabase, ui } = await fill();
    supabase.auth.signUp.mockResolvedValue({ data: { user: null }, error: { code: 'user_already_exists', message: 'User already registered' } });
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(ui.alerts.present).toHaveBeenCalledWith('Registration Failed', 'The email address is already in use by another account', 'error');
  });
});
