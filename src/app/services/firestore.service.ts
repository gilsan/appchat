import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { from, Observable, Subject } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { IInfo, IUser } from '../models/userInfo';
import { convertSnaps } from './firebase-util';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  userSubject = new Subject();
  userSubject$ = this.userSubject.asObservable();
  user;

  userInfo: IInfo;
  userInfoSubject = new Subject();
  userInfoSubject$ = this.userInfoSubject.asObservable();
  isLoggedIn = false;
  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private store: StoreService
  ) { }

  getUserInfo(): void {
    this.auth.currentUser.then(user => {
      this.user = user;

      this.userInfo.email = user.email;
      this.userInfo.uid = user.uid;
      // console.log('[28][getUserInfo] ', this.userInfo);
      this.userSubject.next(this.userInfo);
    });
  }

  authUser(): boolean {
    return this.isLoggedIn;
    // return this.auth.authState !== null && this.auth.authState !== undefined ? true : false;
  }

  login(email: string, password: string = ''): Observable<any> {
    // console.log('[39][login] ', email, password);
    return from(this.auth.signInWithEmailAndPassword(email, password))
      .pipe(
        tap((data: any) => {
          // console.log('[LOGIN][46]', data.user.uid, data.user.email);
          this.store.setUserInfo(data.user.email, data.user.uid);
          // this.getUserInfo();
          // this.userInfo.email = data.user.email;
          // this.userInfo.uid = data.user.uid;
          this.userSubject.next({ uid: data.user.uid, email: data.user.email });
          this.isLoggedIn = true;
        }),
        map(data => data.user),
      );
  }

  logout(uid: string): Promise<any> {
    this.isLoggedIn = false;
    this.db.doc(`users/${uid}`).update({
      state: 'offline'
    });
    return this.auth.signOut();
  }

  setUserState(state: string, email: string = ''): Promise<any> {
    const userInfo = this.store.getUserInfo();
    return this.db.doc(`users/${userInfo.uid}`).update({
      state
    });
    // .then(() => {
    //   this.updateUserInfo();
    // });

    // return this.db.doc(`state/${this.user.uid}`).update({
    //   state,
    //   email,
    //   uid: this.user.uid
    // });
  }



  // 내상태 update 하기
  setMyStateUpdate(uid: string): Observable<any> {
    return from(this.db.doc(`users/${uid}`).update({ state: 'online' }));
  }

  //  친구에게 내 상태 update 하기
  setMyStateToFriend(uid: string, friendUid: string): Observable<any> {
    return from(this.db.doc(`users/${friendUid}/myfriends/${uid}`).update({
      state: 'online'
    }));
  }



  sighup(email: string, password: string): Observable<any> {
    return from(this.auth.createUserWithEmailAndPassword(email, password))
      .pipe(
        tap(() => this.getUserInfo())
      );
  }

  setUserData(displayName: string = '', photoURL: string = ''): void {
    this.db.doc(`state/${this.user.uid}`).set({
      state: 'online',
      uid: this.user.uid,
      email: this.user.email
    });

    this.db.doc(`users/${this.user.uid}`).set({
      email: this.user.email,
      displayName,
      photoURL,
      uid: this.user.uid,
      state: 'online',
    }).then(() => {
      this.db.doc(`users/${this.user.uid}`).get().subscribe((snapShot) => {
        this.userInfo = snapShot.data() as IUser;
        this.userInfoSubject.next(this.userInfo);
      });
    });
  }

  // 사용자 정보 가져오기
  getUserDetail(): void {
    this.updateUserInfo();
  }

  updateUserInfo(): void {
    this.db.doc(`users/${this.user.uid}`).get().subscribe((snapShot) => {
      this.userInfo = snapShot.data() as IUser;
      this.userInfoSubject.next(this.userInfo);
    });
  }

  getUserInfoByUid(uid: string): void {
    this.db.doc(`users/${uid}`).get().subscribe((snapShot) => {
      this.userInfo = snapShot.data() as IUser;
      this.userInfoSubject.next(this.userInfo);
    });
  }

  // 친구 uid 가져오서 친구상태 변경하기
  getMyFriendsUidAndChangeState(uid: string): void {
    this.db.doc(`users/${uid}`).collection('myfriends').snapshotChanges()
      .pipe(
        map(result => convertSnaps<any>(result)),
        take(1),
        map(lists => lists.map(list => list.id)),
        switchMap(lists => from(lists)),
        switchMap(friendUid => this.db.doc(`users/${friendUid}/myfriends/${uid}`).update({ state: 'offline' }))
      ).subscribe();
  }

}
