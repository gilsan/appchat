import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage } from '@angular/fire/storage';

import { Observable, BehaviorSubject, of, from, Subject, combineLatest } from 'rxjs';
import { concatMap, delay, distinct, filter, finalize, first, map, switchMap, take, tap, toArray } from 'rxjs/operators';
import { IConversation, IGroup, IInfo, IMsg, INotifaction, IUser } from '../models/userInfo';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { StoreService } from './store.service';



@Injectable({
  providedIn: 'root'
})
export class MessagesService implements OnDestroy {

  currentChatUser: IUser = { displayName: 'none', email: '', photoURL: '', state: '', uid: 'none' };

  enteredChat = new Subject<boolean>();
  enteredChat$ = this.enteredChat.asObservable();

  firstDocId: string;
  secondDocId: string;

  private subs = new SubSink();
  private userInfo: IInfo;
  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private store: StoreService
  ) {
    this.userInfo = this.store.getUserInfo();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getAllMessages(count: number): Observable<any> {
    let len = 0;
    return from(this.db.collection('messages',
      ref => ref.where('myemail', '==', this.userInfo.email)
        .where('withWhom', '==', this.currentChatUser.email)
        .orderBy('timestamp', 'desc')
        .limit(count)
    )
      .snapshotChanges()
    ).pipe(
      map(snapShot => snapShot.map(snap => snap.payload.doc.data())),
      map(lists => lists.map((list: IConversation) => list.messageId)),
      tap(lists => len = lists.length),
      switchMap(messageIdLists => from(messageIdLists)),
      switchMap(uid => this.db.collection('messages').doc(uid).collection('msgs').get()),
      map(snaps => snaps.docs[0].data()),

    );

  }

  getMessagesAll(uid: string, count: number): Observable<any> {
    return this.db.collection('messages').doc(uid).collection('msgs').doc(this.currentChatUser.uid)
      .collection('msgLists', ref => ref.orderBy('timestamp', 'desc').limit(count))
      .valueChanges().pipe(
        // tap(data => console.log('[메세지] ', data))
      );

  }

  enterChat(user): void {
    if (user !== 'closed') {
      this.currentChatUser = user;
      this.enteredChat.next(true);
    } else {
      this.enteredChat.next(false);
      this.currentChatUser = { displayName: '', email: '', photoURL: '', state: '', uid: '' };
    }
  }

  addNewMsg3(newMsg: string, uid: string, myemail: string, type: string = 'txt'): void {
    // console.log('[메세지추가]', newMsg, myemail, type);
    let isPic;
    if (type === 'txt') {
      isPic = false;
    } else if (type === 'pic') {
      isPic = true;
    }

    const collRef = this.db.collection('conversations').ref;
    const queryRef = collRef.where('myemail', '==', myemail)
      .where('withWhom', '==', this.currentChatUser.email);
    queryRef.get().then((snapShot) => {
      // console.log('[메세지추가]', snapShot);
      if (snapShot.empty) {
        this.db.collection('conversations').add({
          myemail,
          withWhom: this.currentChatUser.email,
          timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
        }).then((firstDocRef) => {
          this.firstDocId = firstDocRef.id;
          this.db.collection('conversations').add({
            myemail: this.currentChatUser.email,
            withWhom: myemail,
            timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
          }).then((secondRef) => {
            this.secondDocId = secondRef.id;
            this.db.collection('messages').add({
              key: Math.floor(Math.random() * 10000000)
            }).then((docRef) => {
              this.db.collection('messages').doc(uid).collection('msgs').add({
                message: newMsg,
                timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
                sentBy: myemail,
                receviceBy: this.currentChatUser.email,
                isPic
              }).then(() => {
                this.db.collection('messages').doc(uid).collection('msgs').add({
                  message: newMsg,
                  timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
                  sentBy: this.currentChatUser.email,
                  receviceBy: myemail,
                  isPic
                }).then(() => {
                  this.db.collection('messages').doc(this.currentChatUser.uid).collection('msgs').add({
                    message: newMsg,
                    timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
                    sentBy: this.currentChatUser.email,
                    receviceBy: myemail,
                    isPic
                  }).then(() => {
                    this.db.collection('messages').doc(this.currentChatUser.uid).collection('msgs').add({
                      message: newMsg,
                      timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
                      sentBy: myemail,
                      receviceBy: this.currentChatUser.email,
                      isPic
                    }).then(() => {
                      console.log('확인 Firestore IF 파트,  저장했습니다.');
                    });
                  });

                });
              });
            });
          });
        });
      } else {

        this.db.doc(`messages/${uid}`).collection('msgs').add({
          message: newMsg,
          timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
          sentBy: myemail,
          receivedBy: this.currentChatUser.email,
          isPic
        }).then(() => {
          this.db.doc(`messages/${uid}`).collection('msgs').add({
            message: newMsg,
            timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
            sentBy: myemail,
            receivedBy: this.currentChatUser.email,
            isPic
          }).then(() => {
            this.db.doc(`messages/${this.currentChatUser.uid}`).collection('msgs').add({
              message: newMsg,
              timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
              sentBy: this.currentChatUser.email,
              receivedBy: myemail,
              isPic
            });
            // console.log('확인 Firebase else 파트,  저장했습니다.');
          });
        });
      }
    });
  }

  addNewMsg(newMsg: string, uid: string, myemail: string, type: string = 'txt'): void {
    // console.log('[메세지추가]', newMsg, uid, this.currentChatUser.uid);
    let isPic;
    if (type === 'txt') {
      isPic = false;
    } else if (type === 'pic') {
      isPic = true;
    }

    this.db.collection('messages').doc(uid).collection('msgs').doc(this.currentChatUser.uid).collection('msgLists').get()
      .subscribe(snapShot => {
        if (snapShot.empty) {
          this.db.collection('messages').doc(uid).collection('msgs').doc(this.currentChatUser.uid).collection('msgLists').add({
            message: newMsg,
            timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
            sentBy: myemail,
            receviceBy: this.currentChatUser.email,
            isPic
          }).then(() => {
            this.db.doc(`messages/${this.currentChatUser.uid}`).collection('msgs').doc(uid).collection('msgLists').add({
              message: newMsg,
              timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
              sentBy: myemail,
              receviceBy: this.currentChatUser.email,
              isPic
            });
          });
        } else {
          this.db.collection('messages').doc(uid).collection('msgs').doc(this.currentChatUser.uid).collection('msgLists').add({
            message: newMsg,
            timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
            sentBy: myemail,
            receviceBy: this.currentChatUser.email,
            isPic
          }).then(() => {
            this.db.doc(`messages/${this.currentChatUser.uid}`).collection('msgs').doc(uid).collection('msgLists').add({
              message: newMsg,
              timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
              sentBy: myemail,
              receviceBy: this.currentChatUser.email,
              isPic
            });
          });
        }
      });

    /*
    const collRef = this.db.collection('conversations').ref;
    const queryRef = collRef.where('myemail', '==', myemail)
      .where('withWhom', '==', this.currentChatUser.email);

    queryRef.get().then((snapShot) => {
      if (snapShot.empty) {
        this.db.collection('messages').doc(uid).collection('msgs').doc(this.currentChatUser.uid).collection('msgLists').add({
          message: newMsg,
          timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
          sentBy: myemail,
          receviceBy: this.currentChatUser.email,
          isPic
        }).then(() => {
          this.db.doc(`messages/${this.currentChatUser.uid}`).collection('msgs').doc(uid).collection('msgLists').add({
            message: newMsg,
            timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
            sentBy: this.currentChatUser.email,
            receviceBy: myemail,
            isPic
          });
        });
      } else {
        this.db.collection('messages').doc(uid).collection('msgs').doc(this.currentChatUser.uid).collection('msgLists').add({
          message: newMsg,
          timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
          sentBy: myemail,
          receviceBy: this.currentChatUser.email,
          isPic
        }).then(() => {
          this.db.doc(`messages/${this.currentChatUser.uid}`).collection('msgs').doc(uid).collection('msgLists').add({
            message: newMsg,
            timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
            sentBy: this.currentChatUser.email,
            receviceBy: myemail,
            isPic
          });
        });
      }
    });
   */
  }

  // 그림 올리기
  uploadPic(file, uid): Observable<any> {
    return from(this.storage.upload(`picmessages/${uid}`, file));
  }

  // 그림 URL 가져오기
  getUploadedPicURL(uid): Observable<any> {
    return this.storage.ref(`picmessages/${uid}`).getDownloadURL();
  }
































}
