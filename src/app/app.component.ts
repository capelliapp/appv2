import { CapelliApiService } from '../providers/capelli-api-service';
import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, Events } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { Login } from '../pages/login/login';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
    
  @ViewChild(Nav) nav: Nav;
  rootPage: any;
  // rootPage: any = HomePage;

  pages: Array<{title: string, component: any}>;

  constructor(public platform: Platform,public events: Events, public statusBar: StatusBar, public splashScreen: SplashScreen, public _capelliApiService: CapelliApiService) {
    this.initializeApp();
    this.rootPage = Login;

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'List', component: ListPage }
    ];

  }

  initializeApp() {
    
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
      this.events.subscribe('profile:loaded', () => {

            if (this._capelliApiService.profileInfo[0].barber) {
                // this.isBarber = true;
                // this.baber_pages = [
                //     { title: 'Barbers Manager', component: barberBookings, icon: 'cut' },
                // ];
            }
        });
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }
}
