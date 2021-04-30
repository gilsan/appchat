import { Component, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, from } from 'rxjs';
import { concatMap, filter, map, switchMap, tap } from 'rxjs/operators';
import { IRequest, IUser } from 'src/app/models/userInfo';
import { FirestoreService } from 'src/app/services/firestore.service';
import { RequestsService } from 'src/app/services/requests.service';
import { UsersService } from 'src/app/services/users.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss']
})
export class RequestsComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  user: IUser;
  requests = [];
  requestsList = [];
  constructor(
    private authservice: FirestoreService,
    private usersService: UsersService,
    private requestService: RequestsService,
    private snackBar: MatSnackBar
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

      this.getMyRequest(this.user.email);
    });
  }

  getMyRequest(email: string): void {
    this.subs.sink = this.requestService.getMyRequest(email)
      .pipe(
        tap(requests => this.requestsList = requests),
        switchMap(requests => from(requests)),
        switchMap((req: IRequest) => this.usersService.getUser(req.sender))
      )
      .subscribe((userInfo) => {

        const item = this.requestsList.find(list => list.sender === userInfo[0].email);
        const idx = this.requests.findIndex(list => list.email === userInfo[0].email);
        if (idx === -1) {
          this.requests.push({ ...userInfo[0], requestId: item.uid });
        }
      });
  }

  checkExist(): void {
    this.subs.sink = this.requestService.friendExistHowMany(this.user.email, 'han@test.com')
      .subscribe(data => {
        // console.log('갯수: ', data);
      });
  }

  acceptRequest(friend: IUser): void {
    console.log('[요청승인]: ', this.user, friend);
    this.requestService
      .addUsersFriend(this.user.email, this.user.uid, friend.email, friend.uid, friend.state)
      .pipe(
        concatMap(() =>
          this.requestService.addUsersFriend(friend.email, friend.uid, this.user.email, this.user.uid, this.user.state)
        )
      ).subscribe((data) => {
        console.log('[사용자 추가', data);
        this.requestService.deleteFriendRequest(friend.requestId)
          .then((res) => {
            if (res === 'OK') {
              this.updateRequest(friend.requestId);
              this.snackBar.open('친구 요청을 승인 하였습니다.', '닫기', { duration: 3000 });
            }
          });
      });
  }

  acceptRequest2(friend: IUser): void {
    console.log('[acceptRequest] ', friend);
    this.subs.sink = this.requestService.friendExistHowMany(this.user.email, friend.email)
      .subscribe(len => {
        if (len === 0) {
          this.subs.sink = this.requestService.friendExist(friend.email)
            .subscribe(exist => {
              if (exist) {
                const user$ = this.requestService.addFriend(this.user.email, this.user.uid);
                const friend$ = this.requestService.addFriend(friend.email, friend.uid);
                this.subs.sink = combineLatest([user$, friend$])
                  .pipe(
                    switchMap(() => this.requestService.addFriendSub(this.user.email, this.user.uid, friend.email)),
                    concatMap(() => this.requestService.addFriendSub(friend.email, friend.uid, this.user.email))
                  )
                  .subscribe((data) => {
                    this.requestService.deleteFriendRequest(friend.requestId)
                      .then((res) => {
                        if (res === 'OK') {
                          this.updateRequest(friend.requestId);
                          this.snackBar.open('친구 요청을 승인 하였습니다.', '닫기', { duration: 3000 });
                        }
                      });
                  });
              } else {
                const user$ = this.requestService.addFriendSubWhenExist(this.user.email, this.user.uid, friend.email);
                const friend$ = this.requestService.addFriendSubWhenExist(friend.email, friend.uid, this.user.email);
                this.subs.sink = combineLatest([user$, friend$]).subscribe((data) => {
                  this.requestService.deleteFriendRequest(friend.requestId)
                    .then((res) => {
                      if (res === 'OK') {
                        this.updateRequest(friend.requestId);
                        this.snackBar.open('친구 요청을 승인 하였습니다.', '닫기', { duration: 3000 });
                      }
                    });

                });
              }

            });
        } else {
          this.snackBar.open('이미 존재 합니다.', '닫기', { duration: 3000 });
        }

      });

    /*
  this.subs.sink = this.requestService.friendExist(friend.email)
    .subscribe(exist => {
      if (exist) {
        const user$ = this.requestService.addFriend(this.user.email, this.user.uid);
        const friend$ = this.requestService.addFriend(friend.email, friend.uid);
        this.subs.sink = combineLatest([user$, friend$])
          .pipe(
            switchMap(() => this.requestService.addFriendSub(this.user.email, this.user.uid, friend.email)),
            concatMap(() => this.requestService.addFriendSub(friend.email, friend.uid, this.user.email))
          )
          .subscribe((data) => {
            this.requestService.deleteFriendRequest(friend.requestId)
              .then((res) => {
                if (res === 'OK') {
                  this.updateRequest(friend.requestId);
                  this.snackBar.open('친구 요청을 승인 하였습니다.', '닫기', { duration: 3000 });
                }
              });
          });
      } else {
        const user$ = this.requestService.addFriendSubWhenExist(this.user.email, this.user.uid, friend.email);
        const friend$ = this.requestService.addFriendSubWhenExist(friend.email, friend.uid, this.user.email);
        this.subs.sink = combineLatest([user$, friend$]).subscribe((data) => {
          this.requestService.deleteFriendRequest(friend.requestId)
            .then((res) => {
              if (res === 'OK') {
                this.updateRequest(friend.requestId);
                this.snackBar.open('친구 요청을 승인 하였습니다.', '닫기', { duration: 3000 });
              }
            });

        });
      }

    });
   */
  }

  updateRequest(requestId: string): void {
    this.requests.forEach((element: any, i) => {
      if (element.requestId === requestId) {
        this.requests.splice(i, 1);
      }
    });
  }

  ignoreRequest(friend: IUser): void {
    this.requestService.deleteFriendRequest(friend.requestId).then((res) => {
      if (res === 'OK') {
        this.updateRequest(friend.requestId);
        this.snackBar.open('친구 요청을 취소 하였습니다.', '닫기', { duration: 3000 });
      }
    });
  }
}
