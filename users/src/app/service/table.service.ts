import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {

  constructor(private firestore: AngularFirestore) { }

  getTable(): Observable<any[]> {
    return this.firestore.collection<any>('orders').snapshotChanges().pipe(
      map(actions => {
        return actions.map(a => {
          const data = a.payload.doc.data();
          const id = a.payload.doc.id;
          return { id, ...data };
        });
      })
    );
  }

  getTableById(id: string): Observable<any> {
    return this.firestore.doc<any>(`table/${id}`).snapshotChanges().pipe(
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

  addToUserTable(userId: string, itemData: any): Observable<any> {
    return from(this.firestore.collection('users').doc(userId).collection('tableBook').add(itemData));
  }

  getTableBook(userId: string): Observable<any[]> {
    return this.firestore.collection('users').doc(userId).collection<any>('tableBook').snapshotChanges().pipe(
        map(actions => {
          return actions.map(a => {
            const data = a.payload.doc.data();
            const id = a.payload.doc.id;
            return { id, ...data };
          });
        })
      );
  }

  addTable(tableDate: any, userId: any): Observable<void> {
    let table = tableDate;
    table.userId = userId;
    const id = this.firestore.createId();
    return from(this.firestore.doc<any>(`tableBook/${id}`).set(table));
  }
}
