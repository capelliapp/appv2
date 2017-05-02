import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { Results } from '../pages/results/results';
import { Login } from '../pages/login/login';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Geolocation } from '@ionic-native/geolocation';
import { HttpModule } from '@angular/http';


import { CapelliApiService } from '../providers/capelli-api-service';
import { DbStorage } from '../providers/dbStorage';
import { CapelliLocationService } from '../providers/capelli-location-service';
import { CustomDatePipe } from '../providers/datePipe.pipe';
import { FromNowPipe } from '../providers/fromNow.pipe';
import { ToPricePipe, FillPipe, StatusPipe, BarberStatusPipe } from '../providers/pricePipe';
import { BoolToString } from '../providers/paidPipe';
import { Signup } from '../pages/signup/signup';
import { ResetPassword } from '../pages/reset-password/reset-password';
import { IntroPage } from '../pages/intro/intro';
import { Storage } from '@ionic/storage';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ListPage,
    Results,
    CustomDatePipe,
    FromNowPipe,
    ToPricePipe,
    BoolToString,
    FillPipe,
    StatusPipe,
    BarberStatusPipe,
    Login,
    Signup,
    ResetPassword,
    IntroPage

  ],
  imports: [
    HttpModule,
    BrowserModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ListPage,
    Results,
    Login,
    Signup,
    ResetPassword,
    IntroPage
  ],
  providers: [
    StatusBar,
    CapelliApiService,
    DbStorage,
    Storage,
    CapelliLocationService,
    SplashScreen,
    CapelliApiService,
    Geolocation,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
