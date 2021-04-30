import { Component, OnInit, OnDestroy } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { delay } from 'rxjs/operators';

import { IInfo, IUser } from 'src/app/models/userInfo';
import { FirestoreService } from 'src/app/services/firestore.service';
import { SubSink } from 'subsink';
import { StoreService } from './../../services/store.service';


@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavBarComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  user: IUser;
  constructor(
    private router: Router,
    private authService: FirestoreService,
    private auth: AngularFireAuth,
    private store: StoreService
  ) { }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    this.subs.sink = this.authService.userInfoSubject$
      .pipe(
        delay(1000)
      )
      .subscribe(info => {
        this.user = info as IUser;
        // console.log('[][NAV-BAR] ', this.user);
      });
  }


  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onToggleOpenSidenav(): void { }

  logout(): void {
    const userInfo = this.store.getUserInfo();
    this.authService.logout(userInfo.uid).then((res) => {
      this.authService.getMyFriendsUidAndChangeState(userInfo.uid);
      this.router.navigate(['/login']);
      // this.authService.setUserState('offline', userInfo.email).then(() => {
      //   this.authService.getMyFriendsUid(this.user.uid);
      //   // this.store.resetUserInfo();
      //   this.router.navigate(['/login']);
      // });
    });

  }

  logout2(): void {

  }

}
