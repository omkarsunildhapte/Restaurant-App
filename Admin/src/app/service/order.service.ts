import { Injectable, inject } from '@angular/core';
import {
  Firestore,
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
export class OrderService {
  db = inject(Firestore);
  ordersCollection = collection(this.db, 'orders');
 //get order list
 getOrder(): Observable<any> {
  return collectionData(this.ordersCollection, {
    idField: 'id',
  }) as Observable<any>;
}

//  update order item
updateOrder(id: string, data: any): Observable<void> {
  const document = doc(this.db, 'order', id);
  return from(updateDoc(document, { ...data }));
}

//  delete order item
deleteOrder(id: string): Observable<void> {
  const document = doc(this.db, 'order', id);
  return from(deleteDoc(document));
}
}
