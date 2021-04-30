import { Injectable } from '@angular/core';
import { IInfo } from '../models/userInfo';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  userInfo: IInfo = { uid: '', email: '' };
  currentChatUser;
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

}
