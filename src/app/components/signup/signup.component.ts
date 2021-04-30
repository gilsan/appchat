import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { FirestoreService } from 'src/app/services/firestore.service';

import { constants } from '../../models/constats';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit, OnDestroy {

  formGroup: FormGroup;
  private subs = new SubSink();

  constructor(
    private fb: FormBuilder,
    private authservice: FirestoreService,
    private dialogRef: MatDialogRef<SignupComponent>,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.loadForm();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  loadForm(): void {
    this.formGroup = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]],
      pwconfirm: []
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
  onRegister(): void {
    if (this.formGroup.value.password === this.formGroup.value.pwconfirm) {
      // console.log(this.formGroup.value);
      this.subs.sink = this.authservice.sighup(
        this.formGroup.value.email,
        this.formGroup.value.password
      ).subscribe((res) => {
        // console.log('[응답]-1', res);
        this.subs.sink = this.authservice.userSubject$.subscribe((user: any) => {
          // console.log('[응답]-2', res);
          if (user.uid) {
            this.authservice.setUserData('아차산', constants.PICTURE_URL);
            this.dialogRef.close();
            this.router.navigate(['/dashboard']);
          }
        });

      });
    } else {
      alert('비밀번호가 일치 하지 않습니다.');
    }
  }

}


