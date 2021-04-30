import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SubSink } from 'subsink';
import { FirestoreService } from 'src/app/services/firestore.service';
import { SignupComponent } from '../signup/signup.component';
import { RequestsService } from 'src/app/services/requests.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  loginForm: FormGroup;
  private subs = new SubSink();

  constructor(
    private fb: FormBuilder,
    private auth: FirestoreService,
    private dialog: MatDialog,
    private router: Router,
    private snackBar: MatSnackBar,
    private requestService: RequestsService
  ) { }

  ngOnInit(): void {
    this.loadForm();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }


  loadForm(): void {
    this.loginForm = this.fb.group({
      email: ['jung@test.com', [Validators.required]],
      password: ['123456', [Validators.required]]
    });
  }

  login_Origin(): void {
    this.subs.sink = this.auth.login(this.loginForm.value.email, this.loginForm.value.password)
      .subscribe((user) => {
        // tslint:disable-next-line:no-shadowed-variable
        this.subs.sink = this.auth.userSubject$.subscribe((user: any) => {
          if (user.uid) {
            this.auth.setUserState('online', user.email).then((res) => {
              this.router.navigate(['/dashboard']);
            });
          }
        });
      });
  }

  login(): void {

    this.subs.sink = this.auth.login(this.loginForm.value.email, this.loginForm.value.password)
      .subscribe((user) => {
        if (user.uid) {

          this.requestService.friendExists(user.uid)
            .subscribe((result) => {

              if (!result) {
                this.requestService.getFriendUid(user.uid)
                  .subscribe(res => {
                    this.auth.setMyStateUpdate(user.uid)
                      .subscribe((data) => {
                        res.forEach(friendID => {
                          this.auth.setMyStateToFriend(user.uid, friendID).subscribe();
                        });
                        this.router.navigate(['/dashboard']);
                      });
                  });
              } else {
                this.router.navigate(['/dashboard']);
              }
            });
        }

      });
  }


  // myfriend uid 가져오기

  register(): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.height = '600px';
    dialogConfig.width = '800px';
    const dialogRef = this.dialog.open(SignupComponent, dialogConfig);
  }

}
