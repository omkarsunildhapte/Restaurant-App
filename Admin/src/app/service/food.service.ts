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
export class FoodService {
  firestore = inject(Firestore);
  foodItemCollection = collection(this.firestore, 'foods');
  // get food List
  getFood(): Observable<any> {
    return collectionData(this.foodItemCollection, {
      idField: 'id',
    }) as Observable<any>;
  }

  // add new food item
  addFood(value: any): Observable<any> {
    const promise = addDoc(this.foodItemCollection, value);
    return from(promise);
  }

  //  update food item
  updateFood(id: string, data: any): Observable<void> {
    const document = doc(this.firestore, 'foods', id);
    return from(updateDoc(document, { ...data }));
  }

  //  delete food item
  deleteFood(id: string): Observable<void> {
    const documentRef = doc(this.firestore, 'foods', id);
    return from(deleteDoc(documentRef));
  }
}
