import { Component, OnInit, OnDestroy } from '@angular/core';
import { IUser } from 'src/app/models/userInfo';
import { StoreService } from './../../services/store.service';
import { SubSink } from 'subsink';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'app-friend-info',
  templateUrl: './friend-info.component.html',
  styleUrls: ['./friend-info.component.scss']
})
export class FriendInfoComponent implements OnInit, OnDestroy {

  isUserSelected = false;
  currentUser: IUser;
  private subs = new SubSink();

  constructor(
    private store: StoreService,
    private messagesService: MessagesService,
  ) { }

  ngOnInit(): void {
    this.init();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  init(): void {
    // this.subs.sink = this.messagesService.enteredChat$.subscribe(value => {
    //   this.currentUser = this.messagesService.currentChatUser;
    // });

    this.subs.sink = this.messagesService.enteredChat$.subscribe((value) => {

      if (value) {
        this.currentUser = this.messagesService.currentChatUser;
        this.isUserSelected = true;

      } else {
        this.isUserSelected = false;
      }
    });



  }




  closeChat(): void { }

}
