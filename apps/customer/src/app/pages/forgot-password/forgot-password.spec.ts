import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ForgotPassword } from '@pages/forgot-password/forgot-password';
import { renderPage, settle } from '@testing/test-providers';

describe('ForgotPassword', () => {
  it('validates the email before sending', async () => {
    const { fixture, element, supabase } = await renderPage(ForgotPassword, { session: null });
    fixture.componentInstance.forgotForm.email().value.set('not-an-email');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Enter a valid email.');
  });

  it('sends the reset email', async () => {
    const { fixture, element, supabase, ui } = await renderPage(ForgotPassword, { session: null });
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.forgotForm.email().value.set('asha@example.com');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('asha@example.com');
    expect(ui.alerts.present).toHaveBeenCalledWith('Forget Password', 'Please check the Email box', 'success');
  });
});
