import { Component, OnInit, OnDestroy } from '@angular/core';
import { IInfo, IUser, IGroup } from 'src/app/models/userInfo';
import { GroupService } from 'src/app/services/group.service';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';
import { SubSink } from 'subsink';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-group-info',
  templateUrl: './group-info.component.html',
  styleUrls: ['./group-info.component.scss']
})
export class GroupInfoComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  members: IUser[] = [];
  currentGroup: IGroup;
  myInfo: IInfo;
  user: IUser;

  constructor(
    private userService: UsersService,
    private store: StoreService,
    private groupService: GroupService,
  ) { }

  ngOnInit(): void {
    this.getMyProfile();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getMyProfile(): void {
    this.myInfo = this.store.getUserInfo();
    this.userService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.user = user[0];
        this.currentGroup = this.groupService.currentGroup;


        this.groupService.getGroupMembers(this.user.email, this.currentGroup.groupName)
          .subscribe(members => {
            this.members = members;
          });
      });
  }









}
