import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/ion-icon';

/** Minus / value / plus control. Emits +1 or -1; the parent owns the value and its limits. */
@Component({
  selector: 'app-quantity-stepper',
  imports: [IonIcon],
  templateUrl: './quantity-stepper.html',
  styleUrl: './quantity-stepper.css',
})
export class QuantityStepper {
  readonly value = input.required<number>();
  readonly label = input<string>('');
  readonly changed = output<number>();
}
