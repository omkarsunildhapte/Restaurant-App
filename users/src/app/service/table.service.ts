  import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, map } from 'rxjs';

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
    
  
  }
