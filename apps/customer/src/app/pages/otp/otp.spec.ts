import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Otp } from '@pages/otp/otp';
import { APP_ROUTE_LINKS } from '@constants/routes.constants';
import { TEST_SESSION } from '@testing/supabase.mock';
import { renderPage, settle } from '@testing/test-providers';

describe('Otp', () => {
  it('verifies the code for the number from the query and asks for an address', async () => {
    const { fixture, element, supabase } = await renderPage(Otp);
    fixture.componentRef.setInput('phoneNumber', '+911234567890');
    supabase.auth.verifyOtp.mockResolvedValue({ data: { session: TEST_SESSION }, error: null });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture.componentInstance.otpForm.otp().value.set('123456');
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({ phone: '+911234567890', token: '123456', type: 'phone_change' });
    expect(navigate).toHaveBeenCalledWith(APP_ROUTE_LINKS.LOCATION);
  });

  it('requires the code', async () => {
    const { fixture, element, supabase } = await renderPage(Otp);
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Otp is required.');
  });
});
