import { Component, OnInit, OnDestroy } from '@angular/core';
import { IUser } from 'src/app/models/userInfo';
import { FirestoreService } from 'src/app/services/firestore.service';
import { StoreService } from 'src/app/services/store.service';
import { UsersService } from 'src/app/services/users.service';

import { SubSink } from 'subsink';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  user: IUser;
  nickNameedit = false;
  spinnerToggle = false;
  newNickName: string;

  constructor(
    private authservice: FirestoreService,
    private usersService: UsersService,
    private store: StoreService
  ) { }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.subs.sink = this.authservice.userInfoSubject$.subscribe(info => {
      this.user = info as IUser;
    });


  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  changeNickname(nickname): void {
    this.user.displayName = nickname;
    this.newNickName = nickname;
  }

  updateName(): void {
    this.usersService.updateName(this.newNickName);
  }

  editName(): void {
    this.nickNameedit = !this.nickNameedit;
  }

  chooseImage(event): void {
    this.usersService.uploadProfilePic(event.target.files.item(0))
      .subscribe();
  }

}
