import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
})
export class ForgetPage implements OnInit {
  forget: FormControl = new FormControl([Validators.required,Validators.email]);
  constructor(
    private afAuth: AngularFireAuth,
  ) {}

  ngOnInit() {
  }
  resetPassword() {
    const email = this.forget.value;
    this.afAuth.sendPasswordResetEmail(email)
      .then(() => {
        console.log('Password reset email sent');
      })
      .catch((error) => {
        console.error('Error sending password reset email:', error);
      });
  }

}
