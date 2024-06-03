import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  updateDoc
} from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  firestore = inject(Firestore);
  tableCollection = collection(this.firestore, 'table');
  tableBookCollection = collection(this.firestore, 'tableBook');

  // get table List
  getTable(): Observable<any> {
    return collectionData(this.tableCollection, {
      idField: 'id',
    }) as Observable<any>;
  }
    //  add table item
  addTable(value: any): Observable<any> {
    const promise = addDoc(this.tableCollection, value);
    return from(promise);
  }

  //  update table item
  updateTable(id: string, data: any): Observable<void> {
    const document = doc(this.firestore, 'table', id);
    return from(updateDoc(document, { ...data }));
  }

  //  delete table item
  deleteTable(id: string): Observable<void> {
    const documentRef = doc(this.firestore, 'table', id);
    return from(deleteDoc(documentRef));
  }

  getTableBook(): Observable<any> {
    return collectionData(this.tableBookCollection, {
      idField: 'id',
    }) as Observable<any>;
  }

  updateTableBook(id: string, data: any): Observable<void> {
    const document = doc(this.firestore, 'tableBook', id);
    return from(updateDoc(document, { ...data }));
  }

  //  delete table item
  deleteTableBook(id: string): Observable<void> {
    const documentRef = doc(this.firestore, 'tableBook', id);
    return from(deleteDoc(documentRef));
  }
  
}
