import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { IGroup, IUser } from '../models/userInfo';
import { resolveProjectReferencePath } from 'typescript';
import { from, Observable, pipe, Subject } from 'rxjs';
import { concatMap, filter, first, map, switchMap, take, tap } from 'rxjs/operators';
import { convertSnaps } from './firebase-util';
import { IMember } from './../models/userInfo';


@Injectable({
  providedIn: 'root'
})
export class GroupService {

  groupDocRef: string;
  currentGroup: IGroup;
  enteredGroup = new Subject<boolean>();
  enteredGroup$ = this.enteredGroup.asObservable();

  groupPicDefault = 'assets/images/mountains.jpg';

  private groupCollection: AngularFirestoreCollection<IGroup[]>;

  constructor(
    private db: AngularFirestore,
    private storage: AngularFireStorage
  ) { }



  createGroup(groupName: string, user: IUser): Promise<any> {
    return new Promise((resolve) => {
      this.db.collection('groups').add({
        groupName,
        creator: user.email,
        conversationId: '',
        groupPic: this.groupPicDefault
      }).then((docRef) => {
        this.groupDocRef = docRef.id;
        docRef.collection('members').add({
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }).then(() => {
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

      });
    });

  }

  getGroups(email: string): Observable<IGroup[]> {
    return this.db.collection<IGroup[]>('groups', ref => ref.where('creator', '==', email))
      .snapshotChanges()
      .pipe(
        map(results => convertSnaps<IGroup>(results)),
        // first()
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

  enterGroup(group): void {
    if (group !== 'closed') {
      this.currentGroup = group;
      this.enteredGroup.next(true);
    } else {
      this.enteredGroup.next(false);
      this.currentGroup = { conversationId: '', creator: '', groupName: '', groupPic: '', groupId: '' };
    }
  }

  // 그림올리기
  uploadProfilePic(file: File, groupUid: string, email: string = ''): Observable<any> {
    return from(this.storage.upload(`groupspics/${groupUid}`, file))
      .pipe(
        // tap(_ => console.log('UPLOAD ==> ')),
        concatMap(() => this.downloadProfilePicURL(groupUid)),
        tap((url) => this.updateGroupInfo(groupUid, url))
      );
  }

  // 그림 URL 가져오기
  downloadProfilePicURL(groupUid: string): Observable<any> {
    return this.storage.ref(`groupspics/${groupUid}`).getDownloadURL();
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
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uid => this.db.doc(`groups/${uid}`).collection('members').add({
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          state: user.state,
          uid: user.uid
        })),
      );
  }

  // 회원목록 가져오기
  getMembersList(email: string, groupName: string): Observable<any> {
    return this.db.collection(`groups`, ref => ref.where('creator', '==', email).where('groupName', '==', groupName)).get()
      .pipe(
        map(snaps => snaps.docs.map(snap => snap.id)),
        switchMap(uid => this.db.doc(`groups/${uid}`).collection('members').snapshotChanges()),
        map(result => convertSnaps(result)),
        map(members => members.filter((member: IMember) => member.email !== email))
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
        switchMap(friendUid => this.db.doc(`groups/${myUid}/members/${friendUid}`).delete())
      );
  }

  // 구룹이미지 변경













}
