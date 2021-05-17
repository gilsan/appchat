import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirestoreService } from 'src/app/services/firestore.service';

import { SubSink } from 'subsink';


import { IGroup, IGroupMsg, IInfo, IMsg, IUser } from './../../models/userInfo';

import { MatDialog } from '@angular/material/dialog';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

import * as _ from 'lodash';
import { concatMap, map } from 'rxjs/operators';
import { SafeResourceUrl } from '@angular/platform-browser';
import { UsersService } from 'src/app/services/users.service';
import { MessagesService } from 'src/app/services/messages.service';
import { StoreService } from './../../services/store.service';
import { GroupService } from 'src/app/services/group.service';
import { GroupMessages } from './../../services/groupMessages';

@Component({
  selector: 'app-group-chat-feed',
  templateUrl: './group-chat-feed.component.html',
  styleUrls: ['./group-chat-feed.component.scss']
})
export class GroupChatFeedComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @ViewChild('scrollMe') private myScroller: ElementRef;
  sanitizer: any;
  constructor(
    private userService: UsersService,
    private dialogRef: MatDialog,
    private store: StoreService,
    private groupService: GroupService,
    private groupMessage: GroupMessages
  ) {
    this.myInfo = this.store.getUserInfo();
  }

  myInfo: IInfo;
  showChat: boolean;
  currentUseremail: string;
  currentChatUser: IUser;
  myProfile: IUser = { displayName: '', email: '', photoURL: '', state: '', uid: '' };
  messages: IMsg[] = [];
  loadingSpinner = false;
  MyId: string;
  MyAvatar: string;
  currentGroup: IGroup;
  group: IGroup;
  newmessage: string;
  checkFirst = 1;
  count = 5; // InfiniteScrollHelper
  trackMsgCount = 0;
  shouldLoad = true;
  allLoaded = false;

  pickMessage: FileList;
  isPicMsg = false;

  ngOnInit(): void {
    this.getMyProfile();
    this.enteredChat();

  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getMyProfile(): void {
    this.myInfo = this.store.getUserInfo();
    this.userService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.MyId = user[0].email;
        this.MyAvatar = user[0].photoURL;
        this.groupService.getGroupsByUid(this.MyId)
          .pipe(
            map(group => group[0])
          )
          .subscribe((group) => {
            this.group = group;
          });
      });
  }



  enteredChat(): void {
    this.subs.sink = this.groupService.enteredGroup$.subscribe(value => {
      this.currentGroup = this.groupService.currentGroup;
      console.log('채팅구룹: ', this.currentGroup);
      if (value) {
        this.showChat = value;
        this.getMessages(this.count);
      } else {
        this.showChat = value;
      }

    });

  }

  getMessages(count): void {
    this.subs.sink = this.groupMessage.getGroupMessages(this.currentGroup.groupId, count)
      .subscribe((messages) => {
        const reverse = _.reverse(messages);
        this.messages = reverse; // 순서를 역순으로 만듬
        console.log('메세지', this.messages);
        if (this.messages.length === this.trackMsgCount) {
          this.shouldLoad = false;
        } else {
          this.trackMsgCount = this.messages.length;
        }

        if (this.checkFirst === 1) {
          this.openDialog();
          this.checkFirst += 1;
        }
        this.scrollDown();

      });
  }


  getMessagesList(): void { }

  addMessage(type): void {

    this.groupMessage.addGroupMsg(this.newmessage, this.currentGroup, this.myInfo.email, type);
    this.newmessage = '';
  }

  addMessageEvent(): void { }

  // 스피너 생성
  openDialog(): void {
    this.dialogRef.open(LoadingSpinnerComponent, {
      height: '150px',
      width: '150px'
    });
  }


  // 다이얼로그 닫기
  closeDialog(): void {
    this.dialogRef.closeAll();
  }

  scrollDown(): void {
    setTimeout(() => {
      this.myScroller.nativeElement.scrollTop = this.myScroller.nativeElement.scrollHeight;
      this.closeDialog();
    }, 1000);
  }

  // 무한 스크롤
  scrollHandler(e): void {
    if (e === 'top') {
      if (this.shouldLoad) {
        this.count += 5;
        this.getMessages(this.count);
      } else {
        this.allLoaded = true;
      }
    }
  }

  sendImage(event): void {
    const selectedFiles = event.target.files;
    if (selectedFiles.item(0)) {
      this.groupMessage.uploadPic(selectedFiles.item(0), this.currentGroup.groupId)
        .pipe(
          concatMap(() => this.groupMessage.getUploadedPicURL(this.currentGroup.groupId))
        ).subscribe((data) => {
          this.newmessage = data;
          this.addMessage('pic');
        });
    }
  }



}
