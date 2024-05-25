import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentData, DocumentReference } from '@angular/fire/compat/firestore';
import { Observable, from, map } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FoodService {

  constructor(private firestore: AngularFirestore) { }
  
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
   
  deleteAllFromCart(userId: string): Observable<void> {
    const cartCollection = this.firestore.collection('users').doc(userId).collection('addToCart');
    return from(cartCollection.get().toPromise().then(snapshot => {
      const batch = this.firestore.firestore.batch();
      if(snapshot){
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
      return batch.commit();
    }));
  }

  addToUserOrder(userId: string, itemData: any): Observable<any> {
    return from(this.firestore.collection('users').doc(userId).collection('addOrder').add(itemData));
  }
  
  addOrder(order: any): Observable<void> {
    const id = this.firestore.createId();
    return from(this.firestore.doc<any>(`orders/${id}`).set(order));
  }

  getUserOrder(userId: string): Observable<any[]> {
    return this.firestore.collection('users').doc(userId)
      .collection<any>('addOrder').snapshotChanges().pipe(
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
