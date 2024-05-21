import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private firestore: AngularFirestore) { }

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

}
