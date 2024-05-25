  import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, from, map } from 'rxjs';

  @Injectable({
    providedIn: 'root'
  })
  export class TableService {
  
  constructor(private firestore: AngularFirestore) { }
  
  getTable(): Observable<any[]> {
    return this.firestore.collection<any>('table').snapshotChanges().pipe(
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

  addTable(tableDate: any,userId:any): Observable<void> {
    const table = {
      time:tableDate.time,
      date:tableDate.date,
      guests:tableDate.guests,
      userId:userId,
      tableid:tableDate.tableId
    };
    const id = this.firestore.createId();
    return from(this.firestore.doc<any>(`tableBook/${id}`).set(table));
  }
  }
