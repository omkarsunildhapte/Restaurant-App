import { ChangePassword } from '@pages/change-password/change-password';
import { renderPage, settle } from '@testing/test-providers';

describe('ChangePassword', () => {
  it('toggles password visibility per box', async () => {
    const { fixture } = await renderPage(ChangePassword);
    fixture.componentInstance.toggle('new');
    expect(fixture.componentInstance.visible()).toEqual({ current: false, new: true, confirm: false });
  });

  it('re-checks the current password and shows a failure', async () => {
    const { fixture, element, supabase, ui } = await renderPage(ChangePassword);
    await settle(fixture);
    supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } });
    const form = fixture.componentInstance.passwordForm;
    form.currentPassword().value.set('old');
    form.newPassword().value.set('new-secret');
    form.confirmPassword().value.set('new-secret');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@example.com', password: 'old' });
    expect(ui.alerts.present).toHaveBeenCalledWith('Password', 'Invalid login credentials', 'error');
  });
});
