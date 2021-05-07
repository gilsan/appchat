import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { IGroup, IInfo } from '../models/userInfo';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  userInfo: IInfo = { uid: '', email: '' };
  currentChatUser;
  groupInfo: IGroup;

  constructor(
    private db: AngularFirestore,
  ) { }

  setUserInfo(userEmail: string, userUid: string): void {
    // console.log('[][STORE] ', userEmail, userUid);
    this.userInfo.uid = userUid;
    this.userInfo.email = userEmail;
  }

  getUserInfo(): IInfo {
    return this.userInfo;
  }

  resetUserInfo(): void {
    this.userInfo = { uid: '', email: '' };
  }

  setCurrentChat(): void {

  }

  getGroupInfo() {
    // this.db.doc(`groups/${this.userInfo.uid}`).group
  }

}
