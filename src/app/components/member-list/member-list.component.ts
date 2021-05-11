import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { SubSink } from 'subsink';

import { GroupService } from 'src/app/services/group.service';
import { IGroup, IInfo } from 'src/app/models/userInfo';
import { StoreService } from 'src/app/services/store.service';



@Component({
  selector: 'app-member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss']
})
export class MemberListComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  myInfo: IInfo;
  myFriends: IGroup[] = [];

  constructor(
    private store: StoreService,
    private groupsService: GroupService,
    public dialogRef: MatDialogRef<MemberListComponent>,
    @Inject(MAT_DIALOG_DATA) public group: IGroup,
  ) { }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.myInfo = this.store.getUserInfo();
    this.groupsService.getGroupMember(this.group.groupId, this.myInfo.email)
      .subscribe(data => {
        this.myFriends = data;
      });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
