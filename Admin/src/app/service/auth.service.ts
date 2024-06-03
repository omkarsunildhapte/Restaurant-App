import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
 private firebaseAuth = inject(Auth);
 router =inject(Router)
  register(name: string, email: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((res:any) => {
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
      localStorage.setItem('email',res.user.displayName)
      localStorage.setItem('displayName',res.user.email)
      localStorage.setItem('accessToken',res.user.accessToken)
    });
    return from(promise)
  }

  logout(){
    const promise = signOut(this.firebaseAuth)
    .then(() => {
      this.router.navigate(['/']);
      localStorage.clear();
    })
    .catch(error => {
      console.error('Logout error:', error);
    });
  }
}
