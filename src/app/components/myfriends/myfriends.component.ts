import { Component, OnInit, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import { FirestoreService } from 'src/app/services/firestore.service';
import { IUser, IInfo } from 'src/app/models/userInfo';
import { FriendsService } from 'src/app/services/friends.service';
import { concatMap, filter, map, switchMap, tap, toArray } from 'rxjs/operators';
import { UsersService } from 'src/app/services/users.service';
import { from } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreService } from 'src/app/services/store.service';
import { MessagesService } from 'src/app/services/messages.service';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-myfriends',
  templateUrl: './myfriends.component.html',
  styleUrls: ['./myfriends.component.scss']
})
export class MyfriendsComponent implements OnInit, OnDestroy {

  private user: IUser;
  private userInfo: IInfo;
  private friends: IUser[] = [];
  private friendsLen = 0;
  private friendState = [];
  isShow = false;

  private subs = new SubSink();

  constructor(
    private authservice: FirestoreService,
    private userService: UsersService,
    private friendsService: FriendsService,
    private snackBar: MatSnackBar,
    private store: StoreService,
    private messagesService: MessagesService,
    private groupService: GroupService
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
      // this.friendsState(this.user.email);
    });

    this.userInfo = this.store.getUserInfo();
    this.friendsState(this.userInfo.email);

  }

  enterChat(user): void {
    this.messagesService.enterChat(user);
    this.groupService.enterGroup('closed');
  }

  findMyFriends(email: string): void {
    this.subs.sink = this.friendsService.getFriends(email).subscribe((friends) => {
      if (friends > 0) {
        this.friendsState(email);
      }
    });
  }

  friendsState(email: string): void {
    this.subs.sink = this.friendsService.getMyFriends(email)
      .pipe(
        map(lists => lists.map(list => list.requestEmail)),
        tap(users => {
          this.friendsLen = 0;
          this.friends = [];
          this.friendState = [];
          this.friendsLen = users.length;
        }),
        switchMap(userLists => from(userLists)),
        concatMap((userEmail: string) => this.userService.getUser(userEmail)),
      )
      .subscribe((friendsList: any) => {
        const idx = this.friends.findIndex(friend => friend.email === friendsList[0].email);
        if (idx === -1) {
          this.friends = [...this.friends, ...friendsList];
        }

        if (this.friends.length === this.friendsLen) {
          this.friends.forEach((el, i) => {
            this.friendState.push({ state: el.state });
          });
          this.isShow = true;
        }

      });
  }


  removeFriend(friend): void {

    this.subs.sink = this.friendsService.deleteMyFriends(this.user.email, this.user.uid, friend.email, friend.uid)
      .subscribe(data => {
        this.snackBar.open('삭제 했습니다.', '닫기', { duration: 3000 });
      });
  }

}
