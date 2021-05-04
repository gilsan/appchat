import { Component, OnInit, OnDestroy } from '@angular/core';
import { IGroup, IInfo, IMember, IUser } from 'src/app/models/userInfo';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GroupService } from 'src/app/services/group.service';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';
import { SubSink } from 'subsink';
import { switchMap, tap } from 'rxjs/operators';
import { MessagesService } from 'src/app/services/messages.service';
import { combineLatest, from } from 'rxjs';

@Component({
  selector: 'app-mygroup',
  templateUrl: './mygroup.component.html',
  styleUrls: ['./mygroup.component.scss']
})
export class MygroupComponent implements OnInit, OnDestroy {

  showAdd = false;
  groupName = '';
  myInfo: IInfo;
  user: IUser;
  myGroups: IGroup[] = [];
  groupLists: IGroup[] = [];

  private subs = new SubSink();

  constructor(
    private groupService: GroupService,
    private userService: UsersService,
    private store: StoreService,
    private snackBar: MatSnackBar,
    private messagesService: MessagesService
  ) { }

  ngOnInit(): void {
    this.getMyProfile();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getMyProfile(): void {
    this.myInfo = this.store.getUserInfo();
    this.subs.sink = this.userService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.user = user[0];
        this.getGroups();
      });
  }

  createGroup(): void {
    this.groupService.createGroup(this.groupName, this.user)
      .then(() => {
        this.snackBar.open('구룹 생성 했습니다.', '닫기', { duration: 3000 });
        this.getGroups();
        this.addGroup();
      });
  }

  getGroups(): void {
    this.subs.sink = this.groupService.getGroups(this.user.email)
      .subscribe(groups => {
        this.myGroups = groups;
      });

    // const groupLists$ = this.groupService.getGroupsByCreater(this.user.email);
    // groupLists$
    //   .pipe(
    //     tap(groups => this.myGroups = groups),
    //     switchMap(() => this.groupService.getMembersByEmail(this.user.email)),
    //     switchMap(lists => from(lists)),
    //     switchMap((list: IMember) => this.groupService.getGroupsByCreaterEmailGroup(list.creater, list.groupName)),
    //     tap(group => this.myGroups.push({ ...group[0], isMyGroup: 'N' }))
    //   )
    //   .subscribe();
  }


  chooseImage(event, group): void {
    this.groupService.uploadProfilePic(event.target.files.item(0), group.groupId)
      .subscribe();
  }

  removeGroup(group: IGroup): void {
    console.log(group);
  }

  addGroup(): void {
    this.showAdd = !this.showAdd;
  }
  refreshList(): void { }

  openGroup(group): void {

    this.groupService.enterGroup(group);
    this.messagesService.enterChat('closed');

  }

}

