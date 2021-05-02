import { Component, OnInit, OnDestroy } from '@angular/core';
import { IGroup, IInfo, IUser } from 'src/app/models/userInfo';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';
import { GroupService } from 'src/app/services/group.service';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';
import { AddMemberComponent } from '../add-member/add-member.component';
import { GroupInfoComponent } from './../group-info/group-info.component';
import { RemoveMemberComponent } from '../remove-member/remove-member.component';
import { shareReplay, switchMap, tap } from 'rxjs/operators';

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
      const updatePic$ = this.groupService.getGroupUid(this.myInfo.email, this.currentGroup.groupName)
        .pipe(
          switchMap(uid => this.groupService.uploadProfilePic(this.selectedFiles.item(0), uid, this.myInfo.email)),
          shareReplay()
        );

      this.subs.sink = updatePic$.subscribe(data => {
        // console.log(data);
      });

      this.subs.sink = updatePic$.pipe(
        tap(uid => console.log(uid)),
        switchMap(uid => this.groupService.getGroupByEmail(this.myInfo.email, this.currentGroup.groupName))
      ).subscribe((data) => {
        this.currentGroup = data;
      });
    }
  }








}
