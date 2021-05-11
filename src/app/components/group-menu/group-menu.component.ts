import { Component, OnInit, OnDestroy } from '@angular/core';
import { concatMap, shareReplay, switchMap, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';

import { IGroup, IInfo, IUser } from 'src/app/models/userInfo';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';
import { GroupService } from 'src/app/services/group.service';

import { AddMemberComponent } from '../add-member/add-member.component';
import { GroupInfoComponent } from './../group-info/group-info.component';
import { RemoveMemberComponent } from '../remove-member/remove-member.component';
import { MemberListComponent } from '../member-list/member-list.component';

@Component({
  selector: 'app-group-menu',
  templateUrl: './group-menu.component.html',
  styleUrls: ['./group-menu.component.scss']
})
export class GroupMenuComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  isGroup = false;
  isOwner = false;

  currentGroup: IGroup;
  myInfo: IInfo;
  user: IUser;
  selectedFiles: FileList;
  groupUid: string;

  constructor(
    private userService: UsersService,
    private store: StoreService,
    private groupService: GroupService,
    private dialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.myInfo = this.store.getUserInfo();

    this.userService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.user = user[0];
      });
    this.init();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  init(): void {
    this.enterGroup();
    // this.getMyProfile();
  }

  getMyProfile(): void {
    this.myInfo = this.store.getUserInfo();
    this.userService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.user = user[0];
      });
  }

  enterGroup(): void {
    this.subs.sink = this.groupService.enteredGroup$.subscribe((group) => {
      if (group) {
        this.currentGroup = this.groupService.currentGroup;
        this.isGroup = true;
        this.isOwner = true;
        // console.log('[GROUP MENU] ', this.currentGroup);
      }
    });
  }

  addMember(): void {
    this.dialog.open(AddMemberComponent, {
      height: '500px',
      width: '400px',
      data: this.currentGroup.groupName
    });
  }

  groupInfo(): void {
    this.dialog.open(GroupInfoComponent, {
      height: '500px',
      width: '400px'
    });
  }
  removeMember(): void {
    this.dialog.open(RemoveMemberComponent, {
      height: '500px',
      width: '400px',
      disableClose: true,
      data: { email: this.myInfo.email, groupname: this.currentGroup.groupName, uid: this.user.uid }
    });
  }

  onFileInput(evt): void {
    this.selectedFiles = evt.target.files;
    if (this.selectedFiles.item(0)) {
      //
      this.subs.sink = this.groupService.uploadProfilePic(this.selectedFiles.item(0),
        this.currentGroup.groupId, this.currentGroup.uid)
        .pipe(
          switchMap(() => this.groupService.getGroupsByUid(this.currentGroup.uid))
        )
        .subscribe((data) => {
          this.currentGroup = this.groupService.currentGroup;
        });

    }
  }

  memberList(): void {
    this.dialog.open(MemberListComponent, {
      height: '500px',
      width: '400px',
      data: this.currentGroup
    });
  }






}
