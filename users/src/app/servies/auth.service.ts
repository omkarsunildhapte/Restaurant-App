import { Injectable } from "@angular/core";
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, catchError, from, switchMap } from "rxjs";
import { FirebaseService } from "./firebase.service";
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth,private userService: FirebaseService) {}

  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password))
      .pipe(
        switchMap((userCredential: any) => {
          const uid = userCredential.user.uid;
          const email = userCredential.user.email;
          const displayName = userCredential.user.displayName;
          localStorage.setItem('email', email);
          localStorage.setItem('displayName', displayName);
          localStorage.setItem('uid', uid);
          return this.userService.checkAndAddUser(uid, email, displayName).pipe(
            switchMap(() => from(Promise.resolve(userCredential)))
          );
        }),
        catchError(error => {
          console.error('Login error', error);
          throw error;
        })
      );
  }

  register(name: string, email: string, password: string): Observable<any> {
    return from(this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((userCredential: any) => {
        localStorage.setItem('accessToken', userCredential.user._delegate.accessToken);
        localStorage.setItem('uid', userCredential.user._delegate.uid);
        return userCredential.user.updateProfile({ displayName: name });
      })
      .catch((error: any) => {
        throw error;
      })
    );
  }
  
  
  logout():Observable<void> {
    const promise = this.afAuth.signOut()
      .then(() => {
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
