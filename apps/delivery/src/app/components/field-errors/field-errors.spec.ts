import { TestBed } from '@angular/core/testing';
import { FieldErrors } from '@components/field-errors/field-errors';

describe('FieldErrors', () => {
  function render(show: boolean) {
    const fixture = TestBed.createComponent(FieldErrors);
    fixture.componentRef.setInput('show', show);
    fixture.componentRef.setInput('errors', [{ kind: 'required', message: 'Email is required.' }, { kind: 'email', message: 'Enter a valid email.' }]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists every message once the field is touched', () => {
    const messages = [...render(true).querySelectorAll('[role="alert"]')].map((el) => el.textContent?.trim());
    expect(messages).toEqual(['Email is required.', 'Enter a valid email.']);
  });

  it('shows nothing before that', () => {
    expect(render(false).querySelectorAll('[role="alert"]').length).toBe(0);
  });
});
