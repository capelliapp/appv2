import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { Results } from '../pages/results/results';


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
  ],
  providers: [
    StatusBar,
    CapelliApiService,
    DbStorage,
    CapelliLocationService,
    Storage,
    SplashScreen,
    CapelliApiService,
    Geolocation,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
