import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { combineLatest } from 'rxjs';
import { first, last, switchMap, tap } from 'rxjs/operators';
import * as _ from 'lodash';

import { SubSink } from 'subsink';

import { FriendsService } from 'src/app/services/friends.service';
import { GroupService } from 'src/app/services/group.service';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';

import { IInfo, IRUserInfo, IUser } from 'src/app/models/userInfo';

@Component({
  selector: 'app-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss']
})
export class AddMemberComponent implements OnInit, OnDestroy {

  myFriends: IUser[] = [];
  isMember = [];
  private subs = new SubSink();
  myInfo: IInfo;
  user: IUser;


  constructor(
    private store: StoreService,
    private usersService: UsersService,
    private friendService: FriendsService,
    private groupsService: GroupService,
    public dialogRef: MatDialogRef<AddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public groupname: string,
  ) { }

  ngOnInit(): void {
    this.getMyProfile();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getMyProfile(): void {
    this.myInfo = this.store.getUserInfo();
    this.usersService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.user = user[0];
        this.getFriends();
      });
  }


  getFriends(): void {
    const friends$ = this.usersService.getAllUsers();
    // const members$ = this.groupsService.getMembersListByUid(this.myInfo.uid, this.groupname);
    const members$ = this.groupsService.getIdOfGroup(this.myInfo.uid)
      .pipe(
        tap(data => console.log('구룹ID: ', data)),
        switchMap(uid => this.groupsService.getMembersStore(uid, this.myInfo.email))
      );

    this.subs.sink = combineLatest([friends$, members$])
      .pipe(
        first(),
        // tap(data => console.log('회원갱신: ', data)),
      )
      .subscribe(([friends, members]) => {
        console.log('회원갱신:', friends, members);
        let flag = 0;
        this.myFriends = [];
        this.isMember = [];
        friends.forEach((element, i) => {
          this.myFriends.push(element);
          members.forEach((el) => {
            if (element.email === el.email) {
              flag += 1;
            }
          });

          if (flag > 0) {
            this.isMember[i] = true;
            flag = 0;
          } else {
            this.isMember[i] = false;
            flag = 0;
          }
        });
      });
  }

  addFriend(friend: IUser): void {
    this.groupsService.getGroupId(this.myInfo.uid, this.groupname)
      .then((result) => {
        if (result !== 'none') {
          console.log(' 멤버 추가:', result);
          this.groupsService.addMemberByGroupId(result[0].groupId, friend, this.myInfo, result[0].groupName)
            .then(() => {
              this.getAddedFriends(friend.uid);
            });

        }
      });
  }

  getAddedFriends(friendUid: string): void {
    const friends$ = this.usersService.getAllUsers();
    const members$ = this.groupsService.getMembersStore(this.myInfo.uid, friendUid, this.myInfo.email);

    this.subs.sink = combineLatest([friends$, members$])
      .pipe(
        first(),
        // tap(data => console.log('회원갱신: ', data)),
      )
      .subscribe(([friends, members]) => {
        console.log('회원갱신:', members);
        let flag = 0;
        this.myFriends = [];
        this.isMember = [];
        friends.forEach((element, i) => {
          this.myFriends.push(element);
          members.forEach((el) => {
            if (element.email === el.email) {
              flag += 1;
            }
          });

          if (flag > 0) {
            this.isMember[i] = true;
            flag = 0;
          } else {
            this.isMember[i] = false;
            flag = 0;
          }
        });
      });
  }



}
