  import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, DocumentReference } from '@angular/fire/compat/firestore';
import { Observable, from, map, switchMap } from 'rxjs';

  @Injectable({
    providedIn: 'root'
  })
  export class FirebaseService {
  
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
    getFood(): Observable<any[]> {
      return this.firestore.collection<any>('foods').snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      );
    }
    getFoodById(id: string): Observable<any> {
      return this.firestore.doc<any>(`foods/${id}`).snapshotChanges().pipe(
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

    addToCart(userId: string, itemData: any): Promise<DocumentReference<DocumentData>> {
      return this.firestore.collection('users').doc(userId).collection('addToCart').add(itemData);
    }
     
    getCartItems(userId: string): Observable<any[]> {
      return this.firestore.collection('users').doc(userId)
        .collection<any>('addToCart').snapshotChanges().pipe(
          map(actions => {
            return actions.map(a => {
              const data = a.payload.doc.data();
              const id = a.payload.doc.id;
              return { id, ...data };
            });
          })
        );
    }  
  }
