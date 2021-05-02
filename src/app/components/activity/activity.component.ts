import { Component, OnInit } from '@angular/core';
import { GroupService } from 'src/app/services/group.service';
import { MessagesService } from 'src/app/services/messages.service';
import { combineLatest } from 'rxjs';
import { SubSink } from 'subsink';
import { take, tap, concatMap, filter } from 'rxjs/operators';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss']
})
export class ActivityComponent implements OnInit {

  isGroupExpand = false;
  isFriendExpand = false;

  private subs = new SubSink();

  constructor(
    private messagesService: MessagesService,
    private groupService: GroupService
  ) { }

  ngOnInit(): void {
    this.getGroupState();
  }


  getGroupState(): void {
    const group$ = this.groupService.enteredGroup$;
    const message$ = this.messagesService.enteredChat$;

    this.subs.sink = combineLatest([group$, message$])
      .pipe(
        filter(data => data[0] !== data[1]),
      )
      .subscribe(([group, friend]) => {
        if (!friend && group) {
          this.isFriendExpand = false;
          this.isGroupExpand = true;
        } else if (friend && !group) {
          this.isGroupExpand = false;
          this.isFriendExpand = true;
        }

      });
  }





}
