import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { from, Observable, pipe, Subject, throwError } from 'rxjs';
import { catchError, concatMap, defaultIfEmpty, filter, first, last, map, switchMap, take, tap } from 'rxjs/operators';

import * as firebase from 'firebase';

import { convertSnaps } from './firebase-util';
import { IInfo, IMember, INotifaction } from '../models/userInfo';
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
    console.log('[구룹생성][] ', groupName);
    let groupID;
    return new Promise((resolve) => {
      this.db.doc(`groups/${user.uid}`).collection('group').add({
        creater: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
        groupPic: this.groupPicDefault,
        groupName,
        iMakeGroup: 'Y',
        uid: user.uid,
      }).then((docref) => {
        groupID = docref.id;
        this.db.doc(`groups/${user.uid}`).collection('group').doc(docref.id).update({
          groupId: docref.id
        }).then(() => {
          this.db.collection('groupstore').doc(`${groupID}`).collection('memberof').add({
            creater: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            groupPic: this.groupPicDefault,
            groupName,
            iMakeGroup: 'Y',
            uid: user.uid,
            groupId: groupID,
          }).then(() => {
            resolve('');
          });
        });
      });

    });
  }

  addGroup(groupName: string, user: IUser, groupID: string): Promise<any> {
    return new Promise((resolve) => {
      this.db.doc(`groups/${user.uid}`).collection('group').add({
        creater: user.email,
        displayName: user.displayName,
        groupPic: this.groupPicDefault,
        groupName,
        iMakeGroup: 'N',
        uid: user.uid,
        groupId: groupID,
      }).then(() => {
        this.db.collection('groupstore').doc(`${groupID}`).collection('memberof').add({
          creater: user.email,
          displayName: user.displayName,
          groupPic: this.groupPicDefault,
          groupName,
          iMakeGroup: 'N',
          uid: user.uid,
          groupId: groupID,
        }).then(() => {
          resolve('');
        });
      });
    });
  }

  addNewGroup(groupName: string, user: IUser, groupID: string): Promise<any> {
    return new Promise((resolve) => {
      this.db.doc(`groups/${user.uid}`).collection('group').add({
        creater: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        email: user.email,
        groupPic: this.groupPicDefault,
        groupName,
        iMakeGroup: 'N',
        uid: user.uid,
        groupId: groupID,
      }).then(() => {
        this.db.collection('groupstore').doc(`${groupID}`).collection('memberof').add({
          creater: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
          groupPic: this.groupPicDefault,
          groupName,
          iMakeGroup: 'N',
          uid: user.uid,
          groupId: groupID,
        }).then(() => {
          resolve('');
        });
      });
    });
  }



  // group 중복 검사
  duplicationCheck(groupName: string, user: IUser): Promise<any> {
    console.log('중복검사');
    const collRef = this.db.doc(`groups/${user.uid}`).collection('group').ref;
    const queryRef = collRef.where('groupName', '==', groupName).get();
    return queryRef;
  }

  createGroup2(groupName: string, user: IUser): Promise<any> {
    return new Promise((resolve) => {
      this.db.collection('groups').add({
        groupName,
        creater: user.email,
        conversationId: '',
        groupPic: this.groupPicDefault,
        uid: user.uid,
        displayName: user.displayName,
        isMyGroup: 'Y'
      }).then((docRef) => {
        this.groupDocRef = docRef.id;
        this.db.collection('groupconvos').add({
          groupName,
          creater: user.email
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
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creater', '==', email))
      .snapshotChanges()
      .pipe(
        map(results => convertSnaps(results)),
        first()
      );
  }

  getGroupsByCreaterEmailGroup(email: string, groupname: string): Observable<any> {
    // console.log('group ', email, groupname);
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creater', '==', email).where('groupName', '==', groupname))
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
      );
  }

  getGroupsMembersByUid(uid: string): void {
    this.db.doc(`groups/${uid}`).collection('members').snapshotChanges();
  }

  getGroups(email: string): Observable<IGroup[]> {
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creater', '==', email))
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
    return this.db.collection('groups', ref => ref.where('creater', '==', email).where('groupName', '==', groupname)).get()
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
    return this.db.collection('groups', ref => ref.where('creater', '==', email).where('groupName', '==', groupname)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uid => this.db.doc(`groups/${uid}`).collection('members').get()),
        map(snaps => snaps.docs.map(snap => snap.data())),
        // map(members => members.filter(member => member.email !== email))
      );
  }

  getGroupMembersByUid(uid: string, groupname: string): Observable<any> {
    return this.db.doc(`groups/${uid}`).collection('group').get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(id => this.db.doc(`groups/${uid}`)
          .collection('group').doc(`${id}`).collection('members', ref => ref.where('groupName', '==', groupname)).get()),
        map(snaps => snaps.docs.map(snap => snap.data())),
      );
  }

  enterGroup(group): void {
    if (group !== 'closed') {
      this.currentGroup = group;
      this.enteredGroup.next(true);
    } else {
      this.enteredGroup.next(false);
      this.currentGroup = {
        creater: '', groupName: '', groupPic: '', groupId: '',
        uid: '', displayName: '', iMakeGroup: '', photoURL: '', email: ''
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
        console.log('[그림갱신][newGroup$]');
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
    return this.db.collection(`groups`, ref => ref.where('creater', '==', email).where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id))
      );
  }

  // 회원명단 찿기 하기
  getGroupMember(groupId: string, myemail: string): Observable<any> {
    return this.db.doc(`groupstore/${groupId}`).collection('memberof').get()
      .pipe(
        map(members => members.docs.map(member => member.data())),
        map(members => members.filter((member: IMember) => member.email !== myemail)),
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

  addNotiMemberByUid(friend: IUser, myinfo: IInfo, groupName: string): Observable<any> {
    console.log('[40][NOTI][멤버버생성][354]');
    return this.db.doc(`groups/${myinfo.uid}`)
      .collection('group', ref => ref.where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
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
          console.log('[50][NOTI][멤버생성][370]');
          this.db.doc(`groups/${myinfo.uid}/group/${uid}`).collection('members').doc(docRef.id).update({
            membersUid: docRef.id
          });
        }))
      );
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
        tap(data => console.log('[getNotifications][회원:] ', data)),
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
    console.log('[Nofi 삭제][419]', notiInfo.receiverUid, notiInfo.memberofUid);
    return this.db.doc(`notifications/${notiInfo.receiverUid}/memberof/${notiInfo.memberofUid}`).delete();
  }

  // 회원목록 가져오기
  getMembersList(email: string, groupName: string): Observable<any> {
    return this.db.collection(`groups`, ref => ref.where('creater', '==', email).where('groupName', '==', groupName)).get()
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
    return this.db.collection('groups', ref => ref.where('creater', '==', email).where('groupName', '==', groupName)).get()
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
  getFindGroupByRoomCreater(room: string, creater: string): Observable<any> {
    return this.db.collection('groups', ref => ref.where('creater', '==', creater).where('groupName', '==', room))
      .get().pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
        tap(group => this.newGroup$.next(group[0]))
      );
  }

  getRoomInfo2(notiInfo: INotifaction): Observable<any> {
    console.log('[496][getRoomInfo][2] ==>', notiInfo);
    return this.db.doc(`groups/${notiInfo.senderUid}`).collection('group', ref => ref.where('groupId', '==', notiInfo.groupId)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.data())),
        map((group) => {
          console.log('[498][두번째 방정보찿는다][getRoomInfo] ====>[로 이동 newGroup$][2] ==>', group);
          group[0].isMyGroup = 'N';
          return group;
        }),
        take(1),
        tap(group => this.newGroup$.next(group[0]))
      );

  }

  getRoomInfo(notiInfo: INotifaction): Promise<any> {
    const collRef = this.db.doc(`groups/${notiInfo.senderUid}`).collection('group').ref;
    const queryRef = collRef.where('groupId', '==', notiInfo.groupId).get();
    return new Promise((resolve) => {
      queryRef.then((snaps) => {
        if (!snaps.empty) {
          const group = snaps.docs.map(snap => snap.data());
          this.newGroup$.next(group[0]);
          resolve(snaps.docs.map(snap => snap.data()));
        }
      });
    });
  }













}
