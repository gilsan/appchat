import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';

import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import * as firebase from 'firebase';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { StoreService } from './store.service';
import { GroupService } from './group.service';

import { Observable, BehaviorSubject, of, from, Subject, combineLatest } from 'rxjs';
import { concatMap, delay, distinct, filter, finalize, first, map, switchMap, take, tap, toArray } from 'rxjs/operators';

import { IConversation, IGroup, IGroupMsg, IInfo, IMsg, INotifaction, IUser } from '../models/userInfo';



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

  currentGroup: IGroup;

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private storage: AngularFireStorage,
    private store: StoreService,
    private groupService: GroupService
  ) {
    this.userInfo = this.store.getUserInfo();
    this.currentGroup = this.groupService.currentGroup;
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

  /*   Group 채팅   */

  //  구릅 메세지 추가

  // addGroupMsg(newMessage, group: IGroup, type: string = 'txt'): void {
  //   let isPic;
  //   if (type === 'txt') {
  //     isPic = false;
  //   } else if (type === 'pic') {
  //     isPic = true;
  //   }

  //   this.db.collection('groupconvos/').doc(group.conversationId).collection('messages').add({
  //     message: newMessage,
  //     timestamp: firebase.default.firestore.FieldValue.serverTimestamp(),
  //     sentBy: group.creater,
  //     room: group.groupName,
  //     isPic
  //   }).then(() => {
  //     // this.addGroupNotifications(group);
  //   });
  // }

  // getAllGroupMessages(group: IGroup, count: number) {
  //   // return this.db.collection('groupconvos').doc(`/${group.conversationId}`)
  //   //   .collection('messages', ref => ref.where('room', '==', group.groupName).orderBy('timestamp', 'desc').limit(count))
  //   //   .valueChanges();
  // }

  getAllMessagesByGroup(group: string, count: number): Observable<any> {
    return this.db.collectionGroup('messages', ref => ref.where('room', '==', group)
      .orderBy('timestamp', 'desc').limit(count))
      .valueChanges();
  }

  addGroupNotifications(group: IGroup): void {
    this.db.collection('groupNotifications').add({
      sentBy: group.creater,
      room: group.groupName,
      groupPic: group.groupPic,
      timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
    });
  }

  getGroupNotifications(): void {

  }

































}
