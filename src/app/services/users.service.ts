import { Injectable, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireStorage } from '@angular/fire/storage';
import { IInfo, IRequest, IUser } from '../models/userInfo';
import { FirestoreService } from './firestore.service';
import { from, Observable, pipe } from 'rxjs';
import { concatMap, filter, map, take, tap } from 'rxjs/operators';

import { SubSink } from 'subsink';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService implements OnDestroy {

  user: IInfo;
  private subs = new SubSink();
  constructor(
    private db: AngularFirestore,
    // private authService: AngularFireAuth,
    private storage: AngularFireStorage,
    private authService: FirestoreService,
    private store: StoreService
  ) {
    this.init();
  }

  init(): void {
    this.subs.sink = this.authService.userInfoSubject$.subscribe(info => {
      this.user = info as IInfo;
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // 닉네임 변경
  updateName(newName: string): Promise<any> {
    return this.db.doc(`users/${this.user.uid}`).update({
      displayName: newName
    });
  }

  // 그림올리기
  uploadProfilePic(file: File): Observable<any> {
    return from(this.storage.upload(`profilepics/${this.user.uid}`, file))
      .pipe(
        tap(_ => console.log('UPLOAD ==> ')),
        concatMap(() => this.downloadProfilePicURL()),
        tap(url => console.log('URL ===> ', url)),
        concatMap((url) => this.updatePhotoURL(url)),
        tap(() => this.authService.updateUserInfo())
      );
  }

  // 그림 URL 가져오기
  downloadProfilePicURL(): Observable<any> {
    return this.storage.ref(`profilepics/${this.user.uid}`).getDownloadURL();
  }

  // 사진 변경
  updatePhotoURL(photoURL: string): Observable<any> {
    return from(this.db.doc(`users/${this.user.uid}`).update({
      photoURL
    }));
  }

  // 전체 사용자 찿기
  getAllUsers(): Observable<any> {
    return this.db.collection('users', ref => ref.orderBy('email')).valueChanges()
      .pipe(
        map(users => users.filter((user: IUser) => user.email !== this.user.email))
      );
  }

  // 사용자 정보
  getUser(email: string): Observable<IUser[]> {
    return this.db.collection('users', ref => ref.where('email', '==', email)).get()
      .pipe(
        map((snaps) => {
          return snaps.docs.map(snap => {
            return snap.data() as IUser;
          });
        }),
        take(1),
      );
  }


  // 사용자 검색
  instantSearch(startValue, endValue): Observable<any> {
    // console.log('[user][51]', startValue, endValue);
    return this.db.collection('users', ref => ref.orderBy('displayName').startAfter(startValue)
      .endAt(endValue)).valueChanges().pipe(
        filter(users => users.length !== 0)
      );
  }









}
