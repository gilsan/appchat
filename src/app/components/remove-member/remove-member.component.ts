import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { MatSnackBar } from '@angular/material/snack-bar';
import { SubSink } from 'subsink';

import { FriendsService } from 'src/app/services/friends.service';
import { GroupService } from 'src/app/services/group.service';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';

import { IInfo, IUser } from 'src/app/models/userInfo';
import { combineLatest } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface DialogData {
  email: string;
  groupname: string;
  uid: string;
}

@Component({
  selector: 'app-remove-member',
  templateUrl: './remove-member.component.html',
  styleUrls: ['./remove-member.component.scss']
})
export class RemoveMemberComponent implements OnInit, OnDestroy {

  constructor(
    private store: StoreService,
    private usersService: UsersService,
    private friendService: FriendsService,
    private groupsService: GroupService,
    public dialogRef: MatDialogRef<RemoveMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public info: DialogData,
    private snackBar: MatSnackBar,
  ) { }

  private subs = new SubSink();
  myFriends: IUser[] = [];
  currentUser: IUser;
  myInfo: IInfo;

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.myInfo = this.store.getUserInfo();
    const user$ = this.usersService.getUser(this.info.email);
    // const member$ = this.groupsService.getMembersListByUid(this.info.uid, this.info.groupname);
    const member$ = this.groupsService.getIdOfGroup(this.myInfo.uid)
      .pipe(
        // tap(data => console.log('구룹ID: ', data)),
        switchMap(uid => this.groupsService.getMembersStore(uid, this.myInfo.email))
      );



    combineLatest([user$, member$]).subscribe(([user, friends]) => {
      this.currentUser = user[0];
      this.myFriends = friends;
    });

  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  removeFriend(friend): void {
    this.groupsService.removeMemberByUid(this.currentUser.uid, friend)
      .subscribe((data) => {
        this.snackBar.open('삭제 하였습니다...', '닫기', { duration: 3000 });
      });
  }

  save(): void {
    this.dialogRef.close();
  }

  cancel(): void {
    this.dialogRef.close();
  }

}
