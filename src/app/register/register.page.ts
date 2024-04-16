import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  registrationForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit() {
    this.registrationForm = this.formBuilder.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.registrationForm.controls;
  }

  register() {
    if (this.registrationForm.invalid) {
      return;
    }
    this.afAuth.createUserWithEmailAndPassword(this.registrationForm.value.email, this.registrationForm.value.password)
    .then((userCredential) => {
      const user = userCredential?.user;
      if (user) {
        user.updateProfile({
          displayName: this.registrationForm.value.username
        })
        .then(() => {
          this.router.navigate(['/dashboard']);
        })
        .catch((error) => {
          console.error('Error updating username:', error);
        });
      } else {
        console.error('User is null');
      }
    })
      .catch((error) => {
        console.error('Registration failed:', error);
      });
}

async signInWithGoogle() {
    // try {
    //   const provider = new firebase.auth.GoogleAuthProvider();
    //   const credential = await this.afAuth.signInWithRedirect(provider);
    //   // Redirecting to Google Sign-In page, authentication is handled there
    // } catch (error) {
    //   console.error('Google Sign-In failed', error);
    // }
  }

  async signInWithFacebook() {
    // try {
    //   const provider = new firebase.auth.FacebookAuthProvider();
    //   const credential = await this.afAuth.signInWithRedirect(provider);
    //   // Redirecting to Facebook Sign-In page, authentication is handled there
    // } catch (error) {
    //   console.error('Facebook Sign-In failed', error);
    // }
  }

  async signInWithTwitter() {
    // try {
    //   const provider = new firebase.auth.TwitterAuthProvider();
    //   const credential = await this.afAuth.signInWithRedirect(provider);
    //   // Redirecting to Twitter Sign-In page, authentication is handled there
    // } catch (error) {
    //   console.error('Twitter Sign-In failed', error);
    // }
  }
}
