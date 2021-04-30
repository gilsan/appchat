import { Component, OnInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { StoreService } from 'src/app/services/store.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(
    private authservice: FirestoreService,
    private store: StoreService
  ) { }

  ngOnInit(): void {
    this.init();
  }

  init(): void {
    const userinfo = this.store.getUserInfo();
    // console.log('[DASHBOARD] ', userinfo);
    this.authservice.getUserInfoByUid(userinfo.uid);
  }

}
