import { Component, input } from '@angular/core';
import { FieldErrorsSource } from '@appTypes/ui.types';

/** Validation messages for one Signal Forms field, shown once the field is touched (submit touches all). */
@Component({
  selector: 'app-field-errors',
  templateUrl: './field-errors.html',
  styleUrl: './field-errors.css',
})
export class FieldErrors {
  readonly field = input.required<FieldErrorsSource>();
}
