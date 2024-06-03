import { Injectable } from '@angular/core';
import { AngularFireMessaging } from '@angular/fire/compat/messaging';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { mergeMap } from 'rxjs';
import firebase from 'firebase/compat/app'; 

@Injectable({
  providedIn: 'root'
})
export class OtpService {
 
  constructor(private afAuth: AngularFireAuth) { }

  async sendOtp(phoneNumber: string): Promise<string> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const appVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal' 
      });
      await this.afAuth.signInWithPhoneNumber(phoneNumber, appVerifier);
      return otp;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }  

}
