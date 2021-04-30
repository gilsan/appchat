import { Injectable, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { IFriend, IRequest, IRUserInfo, IUser } from './../models/userInfo';
import { FirestoreService } from './firestore.service';
import { SubSink } from 'subsink';
import { from, Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';
import { resolveSanitizationFn } from '@angular/compiler/src/render3/view/template';


@Injectable({
  providedIn: 'root'
})
export class RequestsService implements OnDestroy {

  requestRef = this.db.collection('requests');
  friendsRef = this.db.collection('friends');
  private subs = new SubSink();
  user: IUser;

  constructor(
    private db: AngularFirestore,
    private authService: FirestoreService
  ) {
    this.init();
  }


  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  init(): void {
    this.subs.sink = this.authService.userInfoSubject$.subscribe(info => {
      this.user = info as IUser;
    });
  }

  addRequest(user: IUser): Promise<any> {
    return new Promise((resolve) => {
      this.requestRef.add({
        sender: this.user.email,
        receiver: user.email,
      }).then((addID) => {
        this.db.collection('requests').doc(`${addID.id}`).update({
          uid: addID.id
        }).then(() => resolve(addID.id));
      });
    });

  }

  myRequestExist(email: string): Promise<string> {
    // tslint:disable-next-line:no-shadowed-variable
    return new Promise((resolve) => {
      const requestRef = this.db.collection('requests').ref;
      const query = requestRef.where('receiver', '==', email).get();
      query.then(snaps => {
        if (snaps.empty) {
          resolve('empty');
        } else {
          resolve('exist');
        }
      });
    });

  }

  getMyRequest(email: string): Observable<any> {
    return this.db.collection('requests', ref => ref.where('receiver', '==', email)).valueChanges()
      .pipe(
        map(requests => requests.filter((request: any) => request.uid !== undefined)),
      );
    // .pipe(
    //   map(snaps => {
    //     return snaps.docs.map(snap => snap.data() as IRequest);
    //   })
    // );
  }

  getSentRequest(email: string): Observable<any> {
    return this.db.collection('requests', ref => ref.where('sender', '==', email)).valueChanges();
    // .pipe(
    //   map(snaps => {
    //     return snaps.docs.map(snap => snap.data() as IRequest);
    //   })
    // );
  }

  getFriends2(email: string): Observable<IFriend[]> {
    return this.db.collection('friends', ref => ref.where('email', '==', email)).get()
      .pipe(
        map(snaps => {
          return snaps.docs.map(snap => snap.data() as IFriend);
        })
      );
  }

  getFriends(email: string): Observable<any> {
    return this.db.collectionGroup('myfriends', ref => ref.where('email', '==', email)).valueChanges();
    // .pipe(
    //   map(snaps => {
    //     return snaps.docs.map(snap => snap.data() as IRUserInfo);
    //   })
    // );
  }

  friendExist(email: string): Observable<boolean> {
    return this.db.collection('friends', ref => ref.where('email', '==', email)).get()
      .pipe(
        map(snaps => {
          return snaps.empty;
        })
      );
  }

  friendExistHowMany(email: string, friendEmail: string): Observable<any> {
    return this.db.collectionGroup('myfriends',
      ref => ref.where('email', '==', email).where('requestEmail', '==', friendEmail))
      .get()
      .pipe(
        map(snaps => {
          return snaps.docs.length;
        }),
      );
  }

  acceptRequest(email): Promise<any> {
    return this.friendsRef.ref.where('email', '==', email).get();
  }

  //////  users/uid/myfriends/friendUid 에 친구 추가
  addUsersFriend(email: string, uid: string, requestEmail: string, friendUid: string, friendState: string): Observable<any> {
    return from(this.db.collection('users').doc(uid).collection('myfriends').doc(friendUid).set({
      email,
      requestEmail,
      state: friendState
    }));
  }

  // 친구 삭제하기
  deleteUsersFrind(email: string, uid: string, friendUid: string): Promise<any> {
    return this.db.doc(`users/${uid}`).collection('myfrends').doc(friendUid).delete();
  }

  // 친구 존재여부 알아보기
  friendExists(uid: string): Observable<boolean> {
    return this.db.doc(`users/${uid}`).collection('myfriends').get()
      .pipe(
        // tap((snaps) => console.log(snaps)),
        map(snaps => {
          return snaps.empty;
        })
      );
  }

  getFriendUid(uid: string): Observable<string[]> {
    return this.db.doc(`users/${uid}`).collection('myfriends').get()
      .pipe(
        map(snaps => {
          return snaps.docs.map(snap => snap.id);
        })
      );
  }
  ///////////////////////////////////////////////////
  addFriend(email: string, uid: string): Observable<any> {
    return from(this.db.collection('friends').doc(uid).set({
      email
    }));
  }

  // 기존에 디렉토리가 없는 경우 콜렉션 및 서브 콜렉션 추가
  addFriendSub(email: string, uid: string, requestEmail: string): Observable<any> {
    return from(this.db.collection('friends').doc(uid).collection('myfriends').add({
      email,
      requestEmail
    }));
  }

  // 기존에 콜렉션이 있는 경우
  addFriendSubWhenExist(email: string, uid: string, requestEmail: string): Observable<any> {
    return from(this.db.doc(`friends/${uid}`).collection('myfriends').add({
      email,
      requestEmail
    }));
  }

  // 친구신청 삭제
  deleteFriendRequest(uid: string): Promise<any> {
    return new Promise((resolve) => {
      this.db.doc(`requests/${uid}`).delete().then((data) => {
        // console.log('[삭제] ', data);
        resolve('OK');
      });
    });
  }


}
