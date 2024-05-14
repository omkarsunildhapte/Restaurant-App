import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@angular/fire/auth';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
 private firebaseAuth = inject(Auth);

  register(name: string, email: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((res:any) => {
      localStorage.setItem('accessToken',res.user._delegate.accessToken);
      localStorage.setItem('uid',res.user._delegate.uid);
      updateProfile(res.user, { displayName: name });
    });
    return from(promise);
  }

  login(email: string, password: string):Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((res:any) =>{
      localStorage.setItem('email',res.user._delegate.email)
      localStorage.setItem('displayName',res.user._delegate.displayName)
    });
    return from(promise)
  }

  logout(){
    const promise = signOut(this.firebaseAuth)
    .then(() => {
      console.log('Logout successful');
    })
    .catch(error => {
      console.error('Logout error:', error);
    });
  }
}
