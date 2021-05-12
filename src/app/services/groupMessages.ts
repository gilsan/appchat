import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { StoreService } from './store.service';
import { IGroup } from 'src/app/models/userInfo';
import * as firebase from 'firebase';


@Injectable({
  providedIn: 'root'
})
export class GroupMessages {





  constructor(
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private store: StoreService
  ) { }

  addGroupMsg(newmessage: string, group: IGroup, email: string, type: string): Promise<any> {
    console.log('구룹메세지: ', newmessage, group, type);
    let isPic;
    if (type === 'txt') {
      isPic = false;
    } else if (type === 'pic') {
      isPic = true;
    }

    return this.db.doc(`groupstore/${group.groupId}`).collection('groupMsg').add({
      message: newmessage,
      isPic: 'N',
      sentBy: email,
      receiveBy: '',
      timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
    });

  }








}
