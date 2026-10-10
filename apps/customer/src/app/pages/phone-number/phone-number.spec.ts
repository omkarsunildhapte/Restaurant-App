import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PhoneNumber } from '@pages/phone-number/phone-number';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { renderPage, settle } from '@testing/test-providers';

describe('PhoneNumber', () => {
  it('sends the OTP and opens the OTP screen with the number', async () => {
    const { fixture, element, supabase } = await renderPage(PhoneNumber);
    supabase.auth.updateUser.mockResolvedValue({ data: {}, error: null });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.phoneForm.phoneNumber().value.set('+911234567890');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(navigate).toHaveBeenCalledWith([APP_ROUTE_LINKS.OTP], { queryParams: { phoneNumber: '+911234567890' } });
  });

  it('shows the provider error and stays', async () => {
    const { fixture, element, supabase, ui } = await renderPage(PhoneNumber);
    supabase.auth.updateUser.mockResolvedValue({ data: null, error: { message: 'Unsupported phone provider' } });
    fixture.componentInstance.phoneForm.phoneNumber().value.set('+911234567890');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(ui.alerts.present).toHaveBeenCalledWith('OTP', 'Unsupported phone provider', 'error');
  });
});
