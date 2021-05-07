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
    this.notificationGroup();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  //
  notificationGroup(): void {
    this.groupService.newGroupOb$.subscribe((newGroup: IGroup) => {
      // 
      this.groupService.duplicationCheck(newGroup.groupName, this.user)
        .subscribe(empty => {
          console.log('[MYGROUP][48] ', empty);
          if (empty) {
            this.groupService.createGroup(newGroup.groupName, this.user)
              .then(() => {
                this.userService.getUser(newGroup.creator)
                  .pipe(
                    switchMap(friend => this.groupService.addMemberByUid(friend[0], this.myInfo, newGroup.groupName))
                  )
                  .subscribe(() => {
                    this.getGroups();
                  });
              });
          } else {
            this.userService.getUser(newGroup.creator)
              .pipe(
                switchMap(friend => this.groupService.addMemberByUid(friend[0], this.myInfo, newGroup.groupName))
              )
              .subscribe(() => {
                this.getGroups();
              });
          }
        });

      // this.myGroups.push(newGroup);
      // this.groupService.addMember(this.user, newGroup.creator, newGroup.groupName);
      // this.groupService.addMemberByUid(friend: IUser, this.myInfo, newGroup.groupName)


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
    this.groupService.duplicationCheck(this.groupName, this.user).subscribe(isDuplicate => {
      // console.log('[MYGROUP]', isDuplicate);
      if (isDuplicate) {
        this.groupService.createGroup(this.groupName, this.user)
          .then(() => {
            this.snackBar.open('구룹 생성 했습니다.', '닫기', { duration: 3000 });
            this.getGroups();
            this.addGroup();
            this.groupName = '';
          });
      } else {
        this.snackBar.open('구룹이 존재 합니다..', '닫기', { duration: 3000 });
      }
    });

  }

  getGroups(): void {
    // this.subs.sink = this.groupService.getGroups(this.user.email)
    //   .subscribe(groups => {
    //     console.log('[MYGROUP]', groups);
    //     this.myGroups = groups;
    //   });

    this.subs.sink = this.groupService.getGroupsByUid(this.user.uid)
      .subscribe(groups => {
        this.myGroups = groups;
      });

    // const group$ = this.groupService.getGroupsByUid(this.user.uid);
    // const members$ = this.groupService.getGroupsMembers(this.user.uid);

    // this.subs.sink = combineLatest(([group$, members$]))
    //   .subscribe(([groups, members]) => {
    //     console.log('[MYGROUP]', groups);
    //   });
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

