import { Component } from '@angular/core';
import { NavController, Platform, LoadingController } from 'ionic-angular';
import { GoogleAnalytics } from 'ionic-native';
import { HomePage } from '../home/home';

@Component({
    selector: 'page-intro',
    templateUrl: 'intro.html'
})
export class IntroPage {

    sliderOptions: any;

    constructor(
        public navCtrl: NavController,
        public platform: Platform,
        public _loadingCtrl: LoadingController
    ) {
        this.platform.ready().then(() => {
            GoogleAnalytics.trackView("Intro");
        });
        this.sliderOptions = {
            pager: true
        };

    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad IntroPage');
    }

    goToHome() {
        let loading = this._loadingCtrl.create({
            content: 'Loading...',
            dismissOnPageChange: true
        });
        loading.present().then(() => {
            console.log('clicked find');
            this.navCtrl.setRoot(HomePage);
            loading.dismiss();
        });

    }

}
