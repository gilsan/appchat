import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { FirestoreService } from 'src/app/services/firestore.service';

import { SubSink } from 'subsink';


import { IInfo, IMsg, IUser } from './../../models/userInfo';

import { MatDialog } from '@angular/material/dialog';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

import * as _ from 'lodash';
import { concatMap } from 'rxjs/operators';
import { SafeResourceUrl } from '@angular/platform-browser';
import { UsersService } from 'src/app/services/users.service';
import { MessagesService } from 'src/app/services/messages.service';
import { StoreService } from './../../services/store.service';

@Component({
  selector: 'app-chat-feed',
  templateUrl: './chat-feed.component.html',
  styleUrls: ['./chat-feed.component.scss']
})
export class ChatFeedComponent implements OnInit, OnDestroy {

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
    private store: StoreService
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
  currentChatUser: IUser = { displayName: '', email: '', photoURL: '', state: '', uid: '' };

  newmessage: string;
  checkFirst = 1;
  count = 5; // InfiniteScrollHelper
  trackMsgCount = 0;
  shouldLoad = true;
  allLoaded = false;

  pickMessage: FileList;
  isPicMsg = false;



  ngOnInit(): void {
    this.enteredChat();
    this.getMyProfile();

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
      });
  }

  enteredChat(): void {
    this.subs.sink = this.messagesService.enteredChat$.subscribe(value => {
      this.currentChatUser = this.messagesService.currentChatUser;
      // console.log('[chat-feed][enteredChat]', this.currentChatUser, this.currentChatUser.uid);
      if (this.currentChatUser.uid !== 'none') {
        console.log('[chat-feed][enteredChat]2', this.currentChatUser.uid);
        this.getMessages();

        if (value) {
          this.showChat = value;
        } else {
          this.showChat = value;
        }
      }

    });
  }

  currentEmail(): void { }

  getMessages(): void {
 
    this.subs.sink = this.messagesService.getMessagesAll(this.myInfo.uid, 10) // 시험용
      .subscribe((messages) => {
        const reverse = _.reverse(messages);
        this.messages = reverse; // 순서를 역순으로 만듬
        console.log('수신메세지: ', this.messages);
      });
  }


  getMessagesList(): void { }

  addMessage(type): void {
    this.messagesService.addNewMsg(this.newmessage, this.myInfo.uid, this.myInfo.email, type);
    this.newmessage = '';
  }

  addMessageEvent(): void { }

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
        // console.log('scroll is top');
        this.messagesService.getAllMessages(this.count);

      } else {
        this.allLoaded = true;
      }

    }
  }

  sendImage(evt): void { }

}
