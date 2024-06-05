import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, catchError, from, map, switchMap } from "rxjs";
import { UserService } from "./user.service";
import { RoutingService } from "./routing.service";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth,private userService: UserService,public routerLink :RoutingService) {}

  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password)).pipe(
      map((userCredential:any) => {
        const { uid, email, displayName } = userCredential.user;
        localStorage.setItem('email', email);
        localStorage.setItem('displayName', displayName || '');
        localStorage.setItem('uid', uid);
        return userCredential;
      }),
      catchError(error => {
        console.error('Login error', error);
        throw error;
      })
    );
  }
  register(name: string, email: string, password: string): Observable<any> {
    return from(this.afAuth.createUserWithEmailAndPassword(email, password)).pipe(
      switchMap((userCredential:any) => {
        debugger
        const { uid, accessToken } = userCredential.user;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('uid', uid);
        return from(userCredential.user.updateProfile({ displayName: name })).pipe(
          switchMap(() => this.userService.checkAndAddUser(uid, email, name)),
          map(() => userCredential)
        );
      }),
      catchError(error => {
        console.error('Registration error', error);
        throw error;
      })
    );
  }
  
  
  logout():Observable<void> {
    localStorage.clear();
    const promise = this.afAuth.signOut()
      .then(() => {
        localStorage.clear()
        this.routerLink.navigateUrl('',undefined)
      })
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
