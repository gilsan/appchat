import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirestoreService } from 'src/app/services/firestore.service';

import { SubSink } from 'subsink';


import { IGroup, IInfo, IMsg, IUser } from './../../models/userInfo';

import { MatDialog } from '@angular/material/dialog';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

import * as _ from 'lodash';
import { concatMap } from 'rxjs/operators';
import { SafeResourceUrl } from '@angular/platform-browser';
import { UsersService } from 'src/app/services/users.service';
import { MessagesService } from 'src/app/services/messages.service';
import { StoreService } from './../../services/store.service';
import { GroupService } from 'src/app/services/group.service';

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
    private firebaseAuth: AngularFireAuth,
    private messagesService: MessagesService,
    private auth: FirestoreService,
    private firestoreService: FirestoreService,
    private userService: UsersService,
    private dialogRef: MatDialog,
    private store: StoreService,
    private groupService: GroupService,
  ) {
    this.myInfo = this.store.getUserInfo();
  }

  myInfo: IInfo;
  showChat: boolean;
  currentUseremail: string;
  myProfile: IUser = { displayName: '', email: '', photoURL: '', state: '', uid: '' };
  messages: IMsg[] = [];
  loadingSpinner = false;
  MyId: string;
  MyAvatar: string;
  currentGroup: IGroup;

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
    // this.enterGroup();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getMyProfile(): void {
    this.myInfo = this.store.getUserInfo();
    // console.log('[GROUP CHAT]', this.myInfo);
    this.userService.getUser(this.myInfo.email)
      .subscribe((user: IUser[]) => {
        this.MyId = user[0].email;
        this.MyAvatar = user[0].photoURL;
      });
  }

  // enterGroup(): void {
  //   this.subs.sink = this.groupService.enteredGroup$.subscribe((group) => {
  //     console.log('[GROUP CHAT][10]');
  //     if (group) {
  //       this.currentGroup = this.groupService.currentGroup;
  //     }
  //   });
  // }

  enteredChat(): void {
    this.subs.sink = this.groupService.enteredGroup$.subscribe(value => {
      this.currentGroup = this.groupService.currentGroup;
      if (value) {
        this.showChat = value;
        // this.getMessages(this.count);
      } else {
        this.showChat = value;
      }

    });

  }

  getMessages(count): void {

    // this.subs.sink = this.messagesService.getMessagesAll(this.myInfo.uid, count)
    //   .subscribe((messages) => {
    //     const reverse = _.reverse(messages);
    //     this.messages = reverse; // 순서를 역순으로 만듬
    //     // console.log('수신메세지: ', this.messages);

    //     if (this.messages.length === this.trackMsgCount) {
    //       this.shouldLoad = false;
    //     } else {
    //       this.trackMsgCount = this.messages.length;
    //     }

    //     if (this.checkFirst === 1) {
    //       this.openDialog();
    //       this.checkFirst += 1;
    //     }
    //     this.scrollDown();

    //   });
  }


  getMessagesList(): void { }

  addMessage(type): void {
    // this.messagesService.addNewMsg(this.newmessage, this.myInfo.uid, this.myInfo.email, type);
    // this.newmessage = '';
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
    // const selectedFiles = event.target.files;
    // if (selectedFiles.item(0)) {
    //   this.messagesService.uploadPic(selectedFiles.item(0), this.myInfo.uid)
    //     .pipe(
    //       concatMap(() => this.messagesService.getUploadedPicURL(this.myInfo.uid))
    //     ).subscribe((data) => {
    //       this.newmessage = data;
    //       this.addMessage('pic');
    //     });
    // }
  }



}
