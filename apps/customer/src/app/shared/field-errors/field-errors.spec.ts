import { TestBed } from '@angular/core/testing';
import { FieldErrorsSource } from '@appTypes/ui.types';
import { FieldErrors } from '@shared/field-errors/field-errors';

const field = (touched: boolean, errors: { kind: string; message?: string }[]): FieldErrorsSource => () => ({ touched: () => touched, errors: () => errors });

describe('FieldErrors', () => {
  it('shows nothing until the field is touched', async () => {
    const fixture = TestBed.createComponent(FieldErrors);
    fixture.componentRef.setInput('field', field(false, [{ kind: 'required', message: 'Email is required.' }]));
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });

  it('lists every message once touched', async () => {
    const fixture = TestBed.createComponent(FieldErrors);
    fixture.componentRef.setInput('field', field(true, [{ kind: 'required', message: 'Email is required.' }, { kind: 'email', message: 'Enter a valid email.' }]));
    await fixture.whenStable();
    const messages = (fixture.nativeElement as HTMLElement).querySelectorAll('[role="alert"]');
    expect([...messages].map((m) => m.textContent?.trim())).toEqual(['Email is required.', 'Enter a valid email.']);
  });
});
