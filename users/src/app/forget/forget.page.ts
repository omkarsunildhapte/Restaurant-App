import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forget',
  templateUrl: './forget.page.html',
  styleUrls: ['./forget.page.scss'],
})
export class ForgetPage implements OnInit {
  forget: FormControl = new FormControl([]);

  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
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
