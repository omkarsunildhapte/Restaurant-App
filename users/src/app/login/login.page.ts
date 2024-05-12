import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private afAuth: AngularFireAuth,
    private navCtrl: NavController
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  get f() {
    return this.loginForm.controls;
  }
  async login() {
    const { email, password } = this.loginForm.value;
    try {
      const userCredential = await this.afAuth.signInWithEmailAndPassword(email, password);
      console.log('Login successful!', userCredential);
    } catch (error) {
      console.error('Login error:', error);
    }
  }
  signInWithFacebook() {
    throw new Error('Method not implemented.');
    }
    signInWithGoogle() {
    throw new Error('Method not implemented.');
    }
}
