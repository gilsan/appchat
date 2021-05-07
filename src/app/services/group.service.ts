import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { from, Observable, pipe, Subject, throwError } from 'rxjs';
import { catchError, concatMap, defaultIfEmpty, filter, first, last, map, switchMap, take, tap } from 'rxjs/operators';

import * as firebase from 'firebase';

import { convertSnaps } from './firebase-util';
import { IInfo, IMember, INotifaction } from './../models/userInfo';
import { IGroup, IUser } from '../models/userInfo';


@Injectable({
  providedIn: 'root'
})
export class GroupService {

  groupDocRef: string;
  currentGroup: IGroup;
  enteredGroup = new Subject<boolean>();
  enteredGroup$ = this.enteredGroup.asObservable();

  groupPicDefault = 'assets/images/mountains.jpg';

  newGroup$ = new Subject();
  newGroupOb$ = this.newGroup$.asObservable();

  private groupCollection: AngularFirestoreCollection<IGroup[]>;

  constructor(
    private db: AngularFirestore,
    private storage: AngularFireStorage
  ) { }

  // 처음 구룹생성
  createGroup(groupName: string, user: IUser): Promise<any> {
    return new Promise((resolve) => {
      this.db.doc(`groups/${user.uid}`).collection('group').add({
        groupName,
        creator: user.email,
        conversationId: user.uid,
        groupPic: this.groupPicDefault,
        uid: user.uid,
        displayName: user.displayName,
        isMyGroup: 'Y',
      }).then((docRef) => {
        this.groupDocRef = docRef.id;
        this.db.doc(`groupconvos/${user.uid}`).collection('group').add({
          groupName,
          creator: user.email
        }).then((docref) => {
          this.db.doc(`groups/${user.uid}`).collection('group').doc(this.groupDocRef).update({
            conversationId: docref.id,
            groupId: this.groupDocRef
          }).then(() => {
            resolve('');
          });
        });
      });
    });
  }



  // group 중복 검사
  duplicationCheck(groupName: string, user: IUser): Observable<any> {
    return this.db.doc(`groups/${user.uid}`).collection('group', ref => ref.where('groupName', '==', groupName))
      .get()
      .pipe(
        map(snaps => snaps.empty),
        last(),
        // tap(data => console.log('중복 검사', data))
      );

  }

  createGroup2(groupName: string, user: IUser): Promise<any> {
    return new Promise((resolve) => {
      this.db.collection('groups').add({
        groupName,
        creator: user.email,
        conversationId: '',
        groupPic: this.groupPicDefault,
        uid: user.uid,
        displayName: user.displayName,
        isMyGroup: 'Y'
      })
        // .then((docRef) => {
        //   this.groupDocRef = docRef.id;
        //   docRef.collection('members').add({
        //     email: user.email,
        //     displayName: user.displayName,
        //     photoURL: user.photoURL,
        //     creater: user.email,
        //     groupName,
        //   })
        .then((docRef) => {
          this.groupDocRef = docRef.id;
          this.db.collection('groupconvos').add({
            groupName,
            creator: user.email
          }).then((docref) => {
            this.db.collection('groups').doc(this.groupDocRef).update({
              conversationId: docref.id,
              groupId: this.groupDocRef
            }).then(() => {
              resolve('');
            });
          });
        });

      // });
    });

  }


  getGroupsByCreater(email: string): Observable<any> {
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creator', '==', email))
      .snapshotChanges()
      .pipe(
        map(results => convertSnaps(results)),
        first()
      );
  }

  getGroupsByCreaterEmailGroup(email: string, groupname: string): Observable<any> {
    // console.log('group ', email, groupname);
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creator', '==', email).where('groupName', '==', groupname))
      .snapshotChanges()
      .pipe(
        map(results => convertSnaps(results)),
        first(),
        tap(group => console.log('[group SERVICE][84] ', group))
      );
  }

  getMembersByEmail(email: string): Observable<any> {

    return this.db.collectionGroup('members', ref => ref.where('email', '==', email))
      .snapshotChanges()
      .pipe(
        map(results => convertSnaps(results)),
        first(),
        map(members => members.filter((member: IMember) => member.email === email)),
      );
  }

  // Uid로 구룹정보 가져옴.
  getGroupsByUid(uid: string): Observable<any> {
    return this.db.doc<IGroup[]>(`groups/${uid}`).collection('group').get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
        tap(data => console.log('[current GROUP][156] ', data))
      );
  }

  getGroupsMembersByUid(uid: string): void {
    this.db.doc(`groups/${uid}`).collection('members').snapshotChanges();
  }

  getGroups(email: string): Observable<IGroup[]> {
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creator', '==', email))
      .snapshotChanges()
      .pipe(
        map(results => convertSnaps<IGroup>(results)),
        // first()
      );
  }

  getGroupsMembers(email: string): Observable<any> {
    return this.db.collectionGroup('members', ref => ref.where('email', '==', email))
      .get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
      );
  }

  getGroupByUid(uid: string): Observable<any> {
    return this.db.doc(`groups/${uid}`).get()
      .pipe(
        map(snap => snap.data()),
        tap(data => console.log('[GROUP] ', data))
      );
  }

  getGroupByEmail(email: string, groupname: string): Observable<any> {
    return this.db.collection('groups', ref => ref.where('creator', '==', email).where('groupName', '==', groupname)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uid => this.db.doc(`groups/${uid}`).get()),
        map(snaps => snaps.data())
      );
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  getGroupInfoByUid(uid: string, groupname: string): Observable<any> {
    return this.db.doc(`groups/${uid}`).collection('group', ref => ref.where('groupName', '==', groupname))
      .get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.data))
      );
  }

  getGroupMembers(email: string, groupname: string): Observable<any> {
    return this.db.collection('groups', ref => ref.where('creator', '==', email).where('groupName', '==', groupname)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uid => this.db.doc(`groups/${uid}`).collection('members').get()),
        map(snaps => snaps.docs.map(snap => snap.data())),
        // map(members => members.filter(member => member.email !== email))
      );
  }

  enterGroup(group): void {
    if (group !== 'closed') {
      this.currentGroup = group;
      this.enteredGroup.next(true);
    } else {
      this.enteredGroup.next(false);
      this.currentGroup = {
        conversationId: '', creator: '', groupName: '', groupPic: '', groupId: '',
        uid: '', displayName: ''
      };
    }
  }



  // 그림올리기
  uploadProfilePic(file: File, groupUid: string, uid: string): Observable<any> {
    return from(this.storage.upload(`groupspics/${groupUid}`, file))
      .pipe(
        // tap(_ => console.log('UPLOAD ==> ')),
        concatMap(() => this.downloadProfilePicURL(groupUid)),
        tap(data => console.log('[uploadProfilePic][239] ', data)),
        tap((url) => this.updateGroupPic(uid, url))
        // tap((url) => this.updateGroupInfo(uid, url))
      );
  }

  // 그림 URL 가져오기
  downloadProfilePicURL(groupUid: string): Observable<any> {
    return this.storage.ref(`groupspics/${groupUid}`).getDownloadURL();
  }

  // Group 그림갱신
  updateGroupPic(uid: string, picUrl: string): void {
    this.db.doc(`groups/${uid}`).collection('group').get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(groupid => this.db.doc(`groups/${uid}/group/${groupid}`).update({
          groupPic: picUrl
        })),
        switchMap(() => this.db.doc(`groups/${uid}`).collection('group').get()),
        map(snaps => snaps.docs.map(snap => snap.data())),
        tap((data: IGroup[]) => this.currentGroup = data[0])
      ).subscribe(() => {
        this.newGroup$.next(this.currentGroup);
        this.enteredGroup.next(true);
      });
  }

  // Group 그림 갱신
  updateGroupInfo(groupUid: string, url: string): void {
    from(this.db.doc(`groups/${groupUid}`).update({
      groupPic: url
    }))
      .pipe(
        switchMap(() => this.db.doc(`groups/${groupUid}`).get()),
        map(snaps => snaps.data()),
        tap((data: IGroup) => this.currentGroup = data)
      )
      .subscribe(() => {
        this.enteredGroup.next(true);
      });
  }



  // group Uid 가져오기
  getGroupUid(email: string, groupName: string): Observable<any> {
    return this.db.collection(`groups`, ref => ref.where('creator', '==', email).where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id))
      );
  }

  // 회원추가 하기
  addMember(user: IUser, email: string, groupName: string): Observable<any> {
    return this.db.collection(`groups`, ref => ref.where('creator', '==', email).where('groupName', '==', groupName)).get()
      // return this.db.doc(`groups/${user.uid}`).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uid => this.db.doc(`groups/${uid}`).collection('members').add({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          state: user.state,
          uid: user.uid,
          groupName,
          creater: email,
        }).then(() => {
          // this.addGroupNotifications(user, email, groupName);
        })),
      );
  }

  addMemberByUid(friend: IUser, myinfo: IInfo, groupName: string): Observable<any> {
    let groupID;
    return this.db.doc(`groups/${myinfo.uid}`)
      .collection('group', ref => ref.where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        tap(uid => groupID = uid[0]),
        switchMap(uid => this.db.doc(`groups/${myinfo.uid}/group/${uid}`).collection('members').add({
          creater: myinfo.email,
          displayName: friend.displayName,
          groupName,
          isMyGroup: 'N',
          uid: friend.uid,
          photoURL: friend.photoURL,
          email: friend.email,
          createrUid: myinfo.uid,
          timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
        }).then((docRef) => {
          this.db.doc(`groups/${myinfo.uid}/group/${uid}`).collection('members').doc(docRef.id).update({
            membersUid: docRef.id
          });
          this.addGroupNotifications(friend, myinfo, groupName, groupID);
        }))
      );
  }

  addNewMember(myInfo: IInfo, notify: INotifaction) {
    // this.db.collection(`groups/${myInfo.uid}/group`)
  }

  // tslint:disable-next-line:adjacent-overload-signatures
  addGroupNotifications(friend: IUser, myinfo: IInfo, groupname: string, groupId: string = ''): void {
    this.db.collection('notifications').doc(friend.uid).collection('memberof').add({
      sentBy: myinfo.email,
      senderUid: myinfo.uid,
      groupId,
      room: groupname,
      receiver: friend.email,
      receiverName: friend.displayName,
      receiverPic: friend.photoURL,
      receiverUid: friend.uid,
      timestamp: firebase.default.firestore.FieldValue.serverTimestamp()
    }).then((docRef) => {
      this.db.collection('notifications').doc(friend.uid).collection('memberof')
        .doc(docRef.id).update({
          memberofUid: docRef.id
        });
    });
  }


  getNotifications(uid: string): Observable<any> {
    return this.db.doc(`notifications/${uid}`).collection('memberof').get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
        // tap(data => console.log('회원: ', data)),
      );
  }

  // notification 삭제
  clearNotifications(uid: string, email: string, room: string): Observable<any> {
    // console.log(uid, email, room);
    return this.db.doc(`notifications/${uid}`)
      .collection('memberof', ref => ref.where('receiver', '==', email)
        .where('room', '==', room)).get().pipe(
          map(snaps => snaps.docs.map(snap => snap.data())),
          filter(data => data.length > 0),
          switchMap((memberInfo: any) => from(this.db.doc(`notifications/${uid}/memberof/${memberInfo[0].memberofUid}`).delete())),
          tap(data => console.log('클리어 ', data)),
        );
  }

  removeNotification(notiInfo: INotifaction): Promise<any> {
    return this.db.doc(`notifications/${notiInfo.receiverUid}/memberof/${notiInfo.memberofUid}`).delete();
  }

  // 회원목록 가져오기
  getMembersList(email: string, groupName: string): Observable<any> {
    return this.db.collection(`groups`, ref => ref.where('creator', '==', email).where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap((uid) => this.db.doc(`groups/${uid}`).collection('members').snapshotChanges()),
        map(result => convertSnaps(result)),
        map(members => members.filter((member: IMember) => member.email !== email))
      );
  }

  getMembersListByUid(uid: string, groupName: string): Observable<any> {
    return this.db.doc(`groups/${uid}`).collection('group', ref => ref.where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap((id) => this.db.doc(`groups/${uid}/group/${id[0]}`).collection('members').snapshotChanges()),
        // filter(data => data.length > 0),
        map(results => convertSnaps(results)),
        first(),
        // tap(data => console.log('[MEMBER] ', data))
      );
  }


  // 회원삭제
  removeMember(email: string, groupName: string, friendEmail: string, myuid: string = ''): Observable<any> {
    let myUid;
    return this.db.collection('groups', ref => ref.where('creator', '==', email).where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        tap(uid => myUid = uid[0]),
        switchMap(uid => this.db.doc(`groups/${uid}`).collection('members', ref => ref.where('email', '==', friendEmail)).get()),
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(friendUid => this.db.doc(`groups/${myUid}/members/${friendUid}`).delete()),
        catchError(err => {
          console.log(err);
          alert('Could not delete item');
          return throwError(err);
        })
      );
  }

  // 회원삭제
  removeMemberByUid(uid: string, friend): Observable<any> {
    return this.db.doc(`groups/${uid}`).collection('group').get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uID => this.db.doc(`groups/${uid}/group/${uID}/members/${friend.membersUid}`).delete()),
        catchError(err => {
          console.log(err);
          alert('삭제 하지 못했습니다.');
          return throwError(err);
        })
      );
  }

  //  방개설자와 방이름으로 구룹개설 정보 찿기
  getFindGroupByRoomCreater(room: string, creator: string): Observable<any> {
    return this.db.collection('groups', ref => ref.where('creator', '==', creator).where('groupName', '==', room))
      .get().pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
        tap(group => this.newGroup$.next(group[0]))
      );
  }

  getRoomInfo(notiInfo: INotifaction): Observable<any> {
    return this.db.doc(`groups/${notiInfo.senderUid}`).collection('group', ref => ref.where('groupId', '==', notiInfo.groupId)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
        map((group) => {
          group[0].isMyGroup = 'N';
          return group;
        }),
        tap(group => this.newGroup$.next(group[0]))
      );

  }













}
