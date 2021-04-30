import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// firebase
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { AngularFirestoreModule } from '@angular/fire/firestore';


import { MaterialModule } from './material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { environment } from 'src/environments/environment';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { SideBarComponent } from './components/side-bar/side-bar.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AddfriendComponent } from './components/addfriend/addfriend.component';
import { RequestsComponent } from './components/requests/requests.component';
import { MyfriendsComponent } from './components/myfriends/myfriends.component';
import { ScrollableDirective } from './directives/scrollable.directive';
import { ChatFeedComponent } from './components/chat-feed/chat-feed.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { RelativeDatePipe } from './pipe/relative-date.pipe';
import { SmartDatePipe } from './pipe/smart.pipe';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    DashboardComponent,
    NavBarComponent,
    SideBarComponent,
    ProfileComponent,
    AddfriendComponent,
    RequestsComponent,
    MyfriendsComponent,
    ScrollableDirective,
    ChatFeedComponent,
    LoadingSpinnerComponent,
    RelativeDatePipe,
    SmartDatePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireAuthModule,
    MaterialModule

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
