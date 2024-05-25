import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Observable, catchError, from, map, switchMap } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: AngularFirestore,private afAuth: AngularFireAuth) { }

  checkAndAddUser(uid: string, email: string, displayName: string): Observable<any> {
    return this.firestore.collection('users').doc(uid).get().pipe(
      switchMap((docSnapshot: any) => {
        if (!docSnapshot.exists) {
          const userData = {
            email: email,
            displayName: displayName,
            uid: uid,
            createdAt: new Date()
          };
          return from(this.firestore.collection('users').doc(uid).set(userData));
        } else {
          return from(Promise.resolve(true));
        }
      })
    );
  }

  updatePhoneNumber(uid: string, phoneNumber: string): Observable<any> {
    return this.firestore.collection('users').doc(uid).get().pipe(
      switchMap((docSnapshot: any) => {
        if (docSnapshot.exists) {
          return from(this.firestore.collection('users').doc(uid).update({ phoneNumber: phoneNumber }));
        } else {
          return from(Promise.reject('User does not exist.'));
        }
      })
    );
  }

  getUserByUID(uid: string): Observable<any> {
    return this.firestore.collection('users').doc(uid).get().pipe(
      map(doc => {
        if (doc.exists) {
          return doc.data();
        } else {
          throw new Error('User not found');
        }
      })
    );
  }

  updateAccount(id: string, data: any): Observable<any> {
    return from(this.firestore.collection('users').doc(id).update(data));
  }

  getuserById(id: string): Observable<any> {
    return this.firestore.doc<any>(`users/${id}`).snapshotChanges().pipe(
      map(doc => {
        if (doc.payload.exists) {
          const data = doc.payload.data();
          const docId = doc.payload.id;
          return { id: docId, ...data };
        } else {
          return null;
        }
      })
    );
  }

  reauthenticateUser(currentPassword: string): Observable<any> {
    return from(this.afAuth.currentUser).pipe(
      switchMap(user => {
        const credential = EmailAuthProvider.credential(user?.email!, currentPassword);
        return from(reauthenticateWithCredential(user!, credential));
      })
    );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.reauthenticateUser(currentPassword).pipe(
      switchMap(() => from(this.afAuth.currentUser).pipe(
        switchMap(user => from(updatePassword(user!, newPassword)))
      )),
      catchError(error => {
        console.error('Error updating password:', error);
        throw error;
      })
    );
  }

}
