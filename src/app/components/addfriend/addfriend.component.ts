import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';

import { IInfo, IRequest, IRUserInfo, IUser } from 'src/app/models/userInfo';
import { SubSink } from 'subsink';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UsersService } from 'src/app/services/users.service';
import { BehaviorSubject, combineLatest, from, Observable, Subject } from 'rxjs';
import { RequestsService } from 'src/app/services/requests.service';
import { IFriend } from './../../models/userInfo';
import { StoreService } from 'src/app/services/store.service';


@Component({
  selector: 'app-addfriend',
  templateUrl: './addfriend.component.html',
  styleUrls: ['./addfriend.component.scss']
})
export class AddfriendComponent implements OnInit, OnDestroy {

  user: IUser;
  friends: IUser[] = [];
  friendsBackup: IUser[] = [];
  private subs = new SubSink();
  friendsLen = 0;

  isRequested = [];
  isSent = [];
  isFriends = [];

  myFriends = [];
  myRequests = [];
  mySendRequests = [];

  friends$: Observable<IUser[]>;

  startAt = new Subject();
  endAt = new Subject();


  constructor(
    private authservice: FirestoreService,
    private usersService: UsersService,
    private requestService: RequestsService,
    private snackBar: MatSnackBar,
    private store: StoreService
  ) { }

  ngOnInit(): void {
    this.init();

  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  init(): void {
    this.subs.sink = this.authservice.userInfoSubject$.subscribe(info => {
      this.user = info as IUser;
      this.getAllUsers();
    });
  }


  getAllUsers(): void {
    this.friends$ = this.usersService.getAllUsers();
    const request$ = this.requestService.getMyRequest(this.user.email);
    const sent$ = this.requestService.getSentRequest(this.user.email);
    const friend$ = this.requestService.getFriends(this.user.email);

    this.subs.sink = combineLatest([this.friends$, request$, sent$, friend$])
      .subscribe(([users, request, sent, chatfriend]) => {

        // this.friendsBackup = users;
        // let requestFlag = 0;
        // let sentFlag = 0;
        // let friendFlag = 0;
        // this.friends = [];
        let tempRequest: IRequest[] = [];
        let tempSent: IRequest[] = [];
        let tempFriend: IRUserInfo[] = [];
        this.isRequested = [];
        this.isSent = [];
        this.isFriends = [];
        // this.friends = users;
        const usersLen = users.length;
        // this.friendsLen = users.length;
        tempRequest = request;
        tempSent = sent;
        tempFriend = chatfriend;
        // console.log('길이: ', this.friendsLen, usersLen, tempRequest.length, tempSent.length, tempFriend.length);

        if (this.friendsLen !== usersLen) {
          this.friends = [];
          this.friendsLen = usersLen;
          this.friendsBackup = users;
          this.friends = users;
          this.stateRequest(tempRequest);
          this.stateSent(tempSent);
          this.stateFriend(tempFriend);
        } else if (this.friendsLen === usersLen) {
          // console.log('목록: ', this.friends);
          if (tempRequest.length > 0) {
            this.stateRequest(tempRequest);
          } else if (tempSent.length > 0) {
            this.stateSent(tempSent);
          } else if (tempFriend.length > 0) {
            this.stateFriend(tempFriend);
          }
        }

        /*
        this.friends.forEach((el, i) => {

          if (tempRequest.length > 0) {
            tempRequest.forEach((requestEl) => {
              if (el.email === requestEl.sender) {
                requestFlag += 1;
              }
            });
            if (requestFlag === 1) {
              this.isRequested[i] = true;
              requestFlag = 0;
            } else {
              this.isRequested[i] = false;
              requestFlag = 0;
            }
          }

          if (tempSent.length > 0) {
            tempSent.forEach((sentEl) => {
              if (el.email === sentEl.sender) {
                sentFlag += 1;
              }
            });
            if (sentFlag === 1) {
              this.isSent[i] = true;
              sentFlag = 0;
            } else {
              this.isSent[i] = false;
              sentFlag = 0;
            }
          }

          if (tempFriend.length > 0) {
            tempFriend.forEach((friendEl) => {
              if (el.email === friendEl.requestEmail) {
                friendFlag += 1;
              }
            });
            if (friendFlag === 1) {
              this.isFriends[i] = true;
              friendFlag = 0;
            } else {
              this.isFriends[i] = false;
              friendFlag = 0;
            }
          }

        });
         */
      });

  }

  stateRequest(tempRequest): void {
    let requestFlag = 0;
    this.friends.forEach((el, i) => {

      if (tempRequest.length > 0) {
        tempRequest.forEach((requestEl) => {
          if (el.email === requestEl.sender) {
            requestFlag += 1;
          }
        });
        if (requestFlag === 1) {
          this.isRequested[i] = true;
          requestFlag = 0;
        } else {
          this.isRequested[i] = false;
          requestFlag = 0;
        }
      }
    });
  }

  stateSent(tempSent): void {
    let sentFlag = 0;
    this.friends.forEach((el, i) => {
      if (tempSent.length > 0) {
        tempSent.forEach((sentEl) => {
          if (el.email === sentEl.sender) {
            sentFlag += 1;
          }
        });
        if (sentFlag === 1) {
          this.isSent[i] = true;
          sentFlag = 0;
        } else {
          this.isSent[i] = false;
          sentFlag = 0;
        }
      }
    });
  }

  stateFriend(tempFriend): void {
    let friendFlag = 0;
    this.friends.forEach((el, i) => {
      if (tempFriend.length > 0) {
        tempFriend.forEach((friendEl) => {
          if (el.email === friendEl.requestEmail) {
            friendFlag += 1;
          }
        });
        if (friendFlag === 1) {
          this.isFriends[i] = true;
          friendFlag = 0;
        } else {
          this.isFriends[i] = false;
          friendFlag = 0;
        }
      }
    });
  }

  addfriend(user: IUser): void {
    // console.log(user);
    this.requestService.addRequest(user).then((uid) => {
      // console.log('[][UID]', uid);
      if (uid) {
        this.snackBar.open('친구 요청을 했습니다.', '닫기', { duration: 3000 });
      } else {
        this.snackBar.open('친구 요청실패 했습니다.', '닫기', { duration: 3000 });
      }
    });
  }

  instantSearch($event): void {
    const q = $event.target.value;

    if (q !== '') {

      this.startAt.next(q);
      this.endAt.next(q + '\uf8ff');
      this.subs.sink = combineLatest([this.startAt, this.endAt])
        .subscribe(([startValue, endValue]) => {
          this.friends$ = this.usersService.instantSearch(startValue, endValue);
          this.subs.sink = this.friends$.subscribe((users) => {
            this.friends = users;
            this.instantSeachFilter(users);
          });
        });
    } else {
      this.instantSeachFilter(this.friendsBackup);
      // this.friends$ = new BehaviorSubject<IUser[]>(this.friendsBackup);
      this.friends = this.friendsBackup;
    }
  }

  instantSeachFilter(users): void {
    if (this.myFriends) {
      this.instantFriend(this.myFriends);
    } else if (this.myRequests) {
      this.instantRequest(this.myRequests);
    } else if (this.mySendRequests) {
      this.instanceSend(this.mySendRequests);
    }
  }

  instantFriend(friends): void {
    this.isFriends = [];
    let flag = 0;
    this.friends.map((userElement, i) => {
      friends.forEach((friendElement) => {
        if (userElement.email === friendElement.email) {
          flag += 1;
        }
      });
      if (flag === 1) { // 친구가 있는 경우
        this.isFriends[i] = true;
        flag = 0;
      } else {
        this.isFriends[i] = false;
        flag = 0;
      }
    });
  }

  instantRequest(request): void {
    this.isRequested = [];
    let flag = 0;
    this.friends.forEach((userElement, i) => {
      request.forEach((requestElement) => {
        if (userElement.email === requestElement.sender) {
          flag += 1;
        }
      });
      if (flag === 1) { // 친구가 있는 경우
        this.isRequested[i] = true;
        flag = 0;
      } else {
        this.isRequested[i] = false;
        flag = 0;
      }

    });
  }

  instanceSend(request): void {
    this.isSent = [];
    let flag = 0;
    this.friends.forEach((userElement, i) => {
      request.forEach((requestElement) => {
        if (userElement.email === requestElement.receiver) {
          flag += 1;
        }
      });
      if (flag === 1) { // 친구가 있는 경우
        this.isSent[i] = true;
        flag = 0;
      } else {
        this.isSent[i] = false;
        flag = 0;
      }

    });
  }




  canShow(idx: number): boolean {
    if (this.isSent[idx]) {
      return false;
    } else if (this.isRequested[idx]) {
      return false;
    } else if (this.isFriends[idx]) {
      return false;
    } else {
      return true;
    }
  }







}
