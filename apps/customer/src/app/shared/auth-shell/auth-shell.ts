import { Component, ViewEncapsulation, input } from '@angular/core';
import { IonCard } from '@ionic/angular/ion-card';
import { IonCardContent } from '@ionic/angular/ion-card-content';
import { IonCardHeader } from '@ionic/angular/ion-card-header';
import { IonCardTitle } from '@ionic/angular/ion-card-title';
import { IonContent } from '@ionic/angular/ion-content';
import { APP } from '@constants/app.constants';
import { Loading } from '@shared/loading/loading';

/**
 * The frame shared by the sign-in screens (login, register, forgot password, phone, OTP): logo,
 * title, an optional `[authSubtitle]` line and the form as projected content.
 * ViewEncapsulation.None so its styles reach the projected Ionic inputs; every rule is scoped
 * under `app-auth-shell`.
 */
@Component({
  selector: 'app-auth-shell',
  imports: [IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, Loading],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.css',
  encapsulation: ViewEncapsulation.None,
})
export class AuthShell {
  readonly title = input.required<string>();
  readonly loading = input<boolean>(false);
  readonly app = APP;
}
