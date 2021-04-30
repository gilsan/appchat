import { Injectable, OnDestroy } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { from, Observable, pipe } from 'rxjs';
import { concatMap, filter, map, switchMap, take, tap } from 'rxjs/operators';

import { IFriend, IRUserInfo, IUser } from '../models/userInfo';
import { FirestoreService } from './firestore.service';

import { SubSink } from 'subsink';
import { convertSnaps } from './firebase-util';


@Injectable({
  providedIn: 'root'
})
export class FriendsService implements OnDestroy {

  user: IUser;
  private subs = new SubSink();

  constructor(
    private db: AngularFirestore,
    private authService: FirestoreService
  ) {
    this.init();
  }


  init(): void {
    this.subs.sink = this.authService.userInfoSubject$.subscribe(info => {
      this.user = info as IUser;
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getMyFriends(email: string): Observable<any> {
    return this.db.collectionGroup('myfriends', ref => ref.where('email', '==', email)).snapshotChanges()
      .pipe(
        map(snapshots => snapshots.map(snap => snap.payload.doc.data())),
        // tap(friends => console.log('친구들 : ', friends)),
      );
  }

  deleteMyFriends(email: string, uid: string, friendEmail: string, friendUid: string): Observable<any> {
    return this.db.doc(`friends/${uid}`).collection('myfriends').snapshotChanges()
      .pipe(
        map(result => convertSnaps<any>(result)),
        // map(results => {
        //   return results.map(snap => {
        //     return { id: results.id, ...results.data() as any };
        //   });
        // }),
        map(lists => lists.filter(list => list.requestEmail === friendEmail)),
        map(lists => lists.filter(list => list.id)),
        switchMap(lists => from(lists)),
        switchMap(item => this.db.doc(`friends/${uid}`).collection('myfriends').doc(item.id).delete()),
        switchMap(() => this.db.doc(`friends/${friendUid}`).collection('myfriends').snapshotChanges()),
        map(result => convertSnaps<any>(result)),
        map(lists => lists.filter(list => list.requestEmail === email)),
        map(lists => lists.filter(list => list.id)),
        switchMap(lists => from(lists)),
        switchMap(item => this.db.doc(`friends/${friendUid}`).collection('myfriends').doc(item.id).delete()),
        tap(list => console.log(list)),
        take(1),
      );
  }

  deleteMyFriends2(uid: string, friendEmail: string): Observable<any> {
    return from(this.db.doc(`friends/${uid}`).delete());
  }


  getFriends2(email: string): Promise<any> {
    return new Promise((resolve) => {
      const friendsRef = this.db.collection('friends').ref;
      const query = friendsRef.where('email', '==', email);
      query.get().then((snapShot) => {
        if (snapShot.empty) {
          resolve('Nothing');
        } else {
          resolve('Exists');
        }
      });
    });
  }

  getFriends(email: string): Observable<any> {
    return this.db.collection('friends', ref => ref.where('email', '==', email)).snapshotChanges()
      .pipe(
        map(snapshots => snapshots.map(snap => snap.payload.doc.data())),
        map(lists => lists.length),
      );


  }



}
