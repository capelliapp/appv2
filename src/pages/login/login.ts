import { Component } from '@angular/core';
import { Signup } from '../signup/signup';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ResetPassword } from '../reset-password/reset-password';
import { NavController, LoadingController, Platform, NavParams, ViewController, AlertController, ModalController, ToastController } from 'ionic-angular';

import { CapelliApiService } from '../../providers/capelli-api-service';
import { EmailValidator } from '../../validators/email.validator';
// import { CapelliDatabaseService } from '../../providers/gbg-database-service/gbg-database-service';
import { DbStorage } from '../../providers/dbStorage';
import { GoogleAnalytics, Keyboard } from 'ionic-native';
import { Storage } from '@ionic/storage';
import { IntroPage } from '../intro/intro';
import { HomePage } from '../home/home';

@Component({
    selector: 'page-login',
    templateUrl: 'login.html'
})
export class Login {
    // For local storage of username
    public loginSuccessful: boolean;
    public username: FormControl;
    public password: FormControl;
    public authForm: FormGroup;
    public requireLogin: boolean = false;


    constructor(
        public navCtrl: NavController,
        private _capelliApiService: CapelliApiService,
        private _dbStorage: DbStorage,
        private _platform: Platform,
        public viewCtrl: ViewController,
        public navParams: NavParams,
        private toastCtrl: ToastController,
        public modalCtrl: ModalController,
        public alertCtrl: AlertController,
        public loadingCtrl: LoadingController,
        public formBuilder: FormBuilder,
        public platform: Platform,
        public storage: Storage
    ) {
        this.platform.ready().then(() => {
            GoogleAnalytics.trackView("Login");
        });
        // The constructor should only include operations that are pretty much instantaneous

        // Create the form group for validation and binding
        this.authForm = this.formBuilder.group({
            'username': ['', Validators.compose([Validators.required, Validators.minLength(3), EmailValidator.isValid])],
            'password': ['', Validators.compose([Validators.required, Validators.minLength(3)])]
        });

        // Assign the controls to variables for easy access later
        this.username = <FormControl>this.authForm.controls['username'];
        this.password = <FormControl>this.authForm.controls['password'];
    }
    public ionViewWillEnter() {

        /*
         * See http://ionicframework.com/docs/v2/api/components/nav/NavController/
         * Runs when the page has loaded. This event only happens once per page being created and added to the DOM.
         * If a page leaves but is cached, then this event will not fire again on a subsequent viewing.
         * The ionViewDidLoad event is good place to put your setup code for the page.
        */

    }
    public ionViewDidEnter() {
        this.platform.ready().then(function () {
            Keyboard.hideKeyboardAccessoryBar(false);
            Keyboard.disableScroll(true);
        });
        console.log(`${this.constructor.name}: in ${this.ionViewDidEnter.name}`);
        this._platform.ready().then(() => {
            console.log(`${this.constructor.name}: platform ready`);

            console.log(`${this.constructor.name}: trying to login using cached credentials`);
            this._capelliApiService.tryAndLoginUsingSavedLoginDetails()
                .then(loggedIn => {
                    if (loggedIn === true) {
                        this._capelliApiService.loadProfile();
                        this.platform.ready().then(() => {
                            this.storage.get('introShown').then((result) => {

                                if (result) {
                                    console.log('go to find, intro shown');
                                    return this.navCtrl.setRoot(HomePage);
                                } else {
                                    console.log('intro not shown, go to intro');
                                    this.storage.set('introShown', true);
                                    return this.navCtrl.setRoot(IntroPage);
                                }
                            });
                        });
                        // 
                    } else {
                        this.requireLogin = true;
                        // We're not logged in so try and get a saved username and put it into the form to make things easier for the user
                        this._dbStorage.getKey('username').then(username => {
                            if (username != null) {
                                // We have to cast to a FormControl so we can update the value on the form
                                this.username.setValue(username);
                            }
                        });
                    }
                })
                .catch(e => {
                    console.error(e);
                });
        });
    }
    public onSubmit() {
        // Save the username and password that were entered, no need to bind to the promise as we're not waiting on the completion
        this._dbStorage.setKey('username', this.username.value);
        this._dbStorage.setKey('password', this.password.value);

        // Display a loader so the user gets some feedback that a time-consuming operation may start
        let loader = this.loadingCtrl.create({ content: 'Logging in...' });
        loader.present();

        this._capelliApiService.getAndSaveToken(this.username.value, this.password.value)
            .subscribe((loginResponse) => {
                // Remove the spinner before continuing and navigating or displaying a login failure
                loader.dismiss().then(() => {
                    this.loginSuccessful = loginResponse.wasSuccessful;
                    if (loginResponse.wasSuccessful) {
                        this._capelliApiService.loadProfile();
                        this.platform.ready().then(() => {
                            this.storage.get('introShown').then((result) => {

                                if (result) {
                                    console.log('go to find, intro shown');
                                    return this.navCtrl.setRoot(HomePage);
                                } else {
                                    console.log('intro not shown, go to intro');
                                    this.storage.set('introShown', true);
                                    return this.navCtrl.setRoot(IntroPage);
                                }
                            });
                        });
                    } else {
                        this.alertCtrl.create(
                            {
                                title: 'Login failure',
                                subTitle: loginResponse.errorMessage,
                                buttons: ['OK']
                            }
                        ).present();
                    }
                });
            }, // subscribe success
            error => {
                console.error(error);
                loader.dismiss().then(() => {
                    this.alertCtrl.create({ title: 'Error logging in', message: error.errorMessage, buttons: ['OK'] }).present();
                });
            }
            ); // subscribe
    }


    goToResetPassword() {
        this.navCtrl.push(ResetPassword);
    }
    goToSignup() {
        this.navCtrl.push(Signup);
    }
}
