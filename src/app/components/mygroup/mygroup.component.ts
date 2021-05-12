import { Component, OnInit, OnDestroy } from '@angular/core';
import { IGroup, IInfo, IMember, IUser } from 'src/app/models/userInfo';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GroupService } from 'src/app/services/group.service';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';
import { SubSink } from 'subsink';
import { first, switchMap, tap } from 'rxjs/operators';
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
    this.notificationGroup();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  //
  notificationGroup(): void {
    this.groupService.newGroupOb$
      .pipe(
        first(),
        tap((data) => console.log('[MY GROUP]', data))
      )
      .subscribe((newGroup: IGroup) => {
        console.log('[MY GROUP][53] ', newGroup);
        this.groupService.duplicationCheck(newGroup.groupName, this.user)
          .then((snapShot) => {
            console.log('[중복검사 결과] [1]', snapShot);
            if (snapShot.empty) {
              console.log('[중복검사 구룹생성] [2]==>', snapShot.empty);
              this.groupService.addNewGroup(newGroup.groupName, this.user, newGroup.groupId)
                .then(() => {
                  this.getGroups();
                });
            }
          });


      });
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

    this.groupService.duplicationCheck(this.groupName, this.user).then((snapShot) => {
      if (snapShot.empty) {
        this.groupService.createGroup(this.groupName, this.user)
          .then(() => {
            this.snackBar.open('구룹 생성 했습니다.', '닫기', { duration: 3000 });
            this.getGroups();
            // this.addGroup();
            this.groupName = '';
          });
      } else {
        this.snackBar.open('구룹이 존재 합니다..', '닫기', { duration: 3000 });
      }
    });

  }

  getGroups(): void {
    this.subs.sink = this.groupService.getGroupsByUid(this.myInfo.uid)
      .subscribe(groups => {
        this.myGroups = groups;
      });
  }


  chooseImage(event, group): void {
    this.groupService.uploadProfilePic(event.target.files.item(0), group.groupId, this.myInfo.uid)
      .subscribe();
  }

  removeGroup(group: IGroup): void {
    console.log(group);
  }

  addGroup(): void {
    this.showAdd = !this.showAdd;
  }
  refreshList(): void {
    this.getGroups();
  }

  openGroup(group): void {
    this.groupService.enterGroup(group);
    this.messagesService.enterChat('closed');

  }

}

