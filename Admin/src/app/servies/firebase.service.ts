import { Injectable, inject } from '@angular/core';
import {Firestore, addDoc, collection, collectionData, setDoc, updateDoc}from'@angular/fire/firestore'
import { Observable, from } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  db= inject(Firestore);
  foodItemCollection =collection(this.db,'foods');
  foodComboCollection =collection(this.db,'foodCombo');
  
  // get food List 
  getFood():Observable<any>{
    return collectionData(
      this.foodItemCollection,{
        idField:'id'
      }
    ) as Observable<any>
  }

  // add new food item 
   addFood(value:any):Observable<any>{
    const promise = addDoc(this.foodItemCollection,value);
    return from(promise)
   } 

  // get food List 
  getFoodCombo():Observable<any>{
    return collectionData(
      this.foodComboCollection,{
        idField:'id'
      }
    ) as Observable<any>
  }

  // add new food item 
   addFoodCombo(value:any):Observable<any>{
    const promise = addDoc(this.foodComboCollection,value);
    return from(promise)
   } 
}
