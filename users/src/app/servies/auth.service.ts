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
        debugger
        localStorage.setItem('email',userCredential.user._delegate.email)
        localStorage.setItem('displayName',userCredential.user._delegate.displayName)
      })
      .catch(error => {
      });
    return from(promise)
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
      console.error('Registration error:', error);
    });
    return from(promise)
  }
  
  logout() {
    this.afAuth.signOut()
      .then(() => {
        console.log('Logout successful');
      })
      .catch(error => {
        console.error('Logout error:', error);
      });
  }  
}
