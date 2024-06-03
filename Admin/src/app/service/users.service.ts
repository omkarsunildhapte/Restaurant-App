import { Injectable, inject } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class UserService {
  db = inject(Firestore);
  usersCollection = collection(this.db, 'users');
  //get user list
  getUser(): Observable<any> {
    return collectionData(this.usersCollection, {
      idField: 'id',
    }) as Observable<any>;
  }  
}
