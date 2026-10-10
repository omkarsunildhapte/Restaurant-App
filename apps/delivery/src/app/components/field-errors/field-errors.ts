import { Component, input } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

/**
 * A Signal Forms field's validation messages, shown once the field has been touched (submit
 * marks every field touched). Usage: `<app-field-errors [show]="f.email().touched()" [errors]="f.email().errors()" />`.
 */
@Component({
  selector: 'app-field-errors',
  templateUrl: './field-errors.html',
  styleUrl: './field-errors.css',
})
export class FieldErrors {
  readonly show = input.required<boolean>();
  readonly errors = input.required<readonly ValidationError[]>();
}
