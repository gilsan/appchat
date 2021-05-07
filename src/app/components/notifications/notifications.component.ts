import { Component, OnInit, OnDestroy } from '@angular/core';
import { SubSink } from 'subsink';
import { IInfo, INotifaction } from 'src/app/models/userInfo';
import { StoreService } from 'src/app/services/store.service';
import { GroupService } from 'src/app/services/group.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {

  showNotifications = false;
  myNotifications: INotifaction[] = [];
  private subs = new SubSink();
  myInfo: IInfo;

  constructor(
    private groupService: GroupService,
    private store: StoreService,
  ) {
    this.myInfo = this.store.getUserInfo();
  }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.groupService.getNotifications(this.myInfo.uid)
      .subscribe((noti: any) => {
        // console.log(noti);
        if (noti.length > 0) {
          this.myNotifications = noti;
          this.showNotifications = true;
        } else {
          this.myNotifications = [];
          this.showNotifications = false;
        }

      });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  accept(msg): void {

    this.groupService.getRoomInfo(msg).subscribe(data => {
      this.groupService.removeNotification(msg)
        .then(() => {
          this.init();
        });
    });

    // this.groupService.getFindGroupByRoomCreater(msg.room, msg.sentBy)
    //   .subscribe(() => {
    //     this.groupService.clearNotifications(this.myInfo.uid, this.myInfo.email, msg.room)
    //       .subscribe((data) => {
    //         console.log('[ACCEPT1] ', data);
    //         this.init();
    //       });
    //   });

  }

  delete(msg): void {
    this.groupService.removeNotification(msg)
      .then(() => {
        this.init();
      });
  }

}
