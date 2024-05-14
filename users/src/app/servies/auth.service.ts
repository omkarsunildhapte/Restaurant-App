import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, from } from "rxjs";
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth) {}

  login(email: string, password: string):Observable<void> {
    const promise =  this.afAuth.signInWithEmailAndPassword(email, password)
      .then((userCredential:any) => {
        localStorage.setItem('email',userCredential.user._delegate.email)
        localStorage.setItem('displayName',userCredential.user._delegate.displayName)
      })
      .catch(error => {
      });
    return from(promise);
  }

  register(name:string,email:string,password:string):Observable<void> {
    const promise =  this.afAuth.createUserWithEmailAndPassword(email, password)
    .then((userCredential:any) => {
      localStorage.setItem('accessToken',userCredential.user._delegate.accessToken)
      localStorage.setItem('uid',userCredential.user._delegate.uid)
      return userCredential.user.updateProfile({ displayName: name });
    })
    .then(() => {
    })
    .catch(error => {
    });
    return from(promise);
  }
  
  logout():Observable<void> {
    const promise = this.afAuth.signOut()
      .then(() => {
      })
      .catch(error => {
      });
      return from(promise);
  }

  resetPassword(email:string):Observable<void> {
    const promise =  this.afAuth.sendPasswordResetEmail(email)
      .then(() => {
      })
      .catch(error => {
      });
      return from(promise)
  }  
}
