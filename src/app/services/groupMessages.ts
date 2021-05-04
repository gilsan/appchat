import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { StoreService } from './store.service';


@Injectable({
  providedIn: 'root'
})
export class GroupMessages {


  constructor(
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private store: StoreService
  ) { }







}
