import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';
import { StoreService } from './store.service';
import { IGroup, IMsg, IUser } from 'src/app/models/userInfo';
import * as firebase from 'firebase';
import { from, Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class GroupMessages {


  constructor(
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private store: StoreService
  ) { }

  addGroupMsg(newmessage: string, group: IGroup, user: IUser, type: string): Promise<any> {
    console.log('구룹메세지: ', newmessage, group, type);
    let isPic: boolean;
    if (type === 'txt') {
      isPic = false;
    } else if (type === 'pic') {
      isPic = true;
    }

    return this.db.doc(`groupstore/${group.groupId}`).collection('groupMsg').add({
      message: newmessage,
      isPic,
      sentBy: user.email,
      sentPhoto: user.photoURL,
      sentName: user.displayName,
      receiveBy: '',
      timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
    });

  }

  getGroupMessages(groupId: string, count: number): Observable<IMsg[]> {
    return this.db.doc(`groupstore/${groupId}`)
      .collection<IMsg>('groupMsg', ref => ref.orderBy('timestamp', 'desc').limit(count))
      .valueChanges();
  }

  // 그림 올리기
  uploadPic(file, groupid): Observable<any> {
    return from(this.storage.upload(`picmessages/${groupid}`, file));
  }

  // 그림 URL 가져오기
  getUploadedPicURL(groupid): Observable<any> {
    return this.storage.ref(`picmessages/${groupid}`).getDownloadURL();
  }

  // 구룹그림 올리기
  uploadGroupPic(file, groupid): Observable<any> {
    return from(this.storage.upload(`grouppics/${groupid}`, file));
  }

  // 구룹그림 URL 가져오기
  getGroupUploadedPicURL(groupid): Observable<any> {
    return this.storage.ref(`grouppics/${groupid}`).getDownloadURL();
  }








}
