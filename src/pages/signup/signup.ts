import { NavController, LoadingController, Platform, AlertController } from 'ionic-angular';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { UserCreationDto } from '../../providers/userCreationDto.model';
import { DbStorage } from '../../providers/dbStorage';
import { CapelliApiService } from '../../providers/capelli-api-service';
import { GoogleAnalytics } from 'ionic-native';
import { HomePage } from '../home/home';
@Component({
    templateUrl: 'signup.html',
    selector: 'page-signup',
})
export class Signup {
    public email: FormControl;
    public forename: FormControl;
    public surname: FormControl;
    public mobile: FormControl;
    public password: FormControl;
    public passwordConfirm: FormControl;
    public code: FormControl;
    public emailStatus: string = 'available';

    public accountForm: FormGroup;
    loading: any;


    constructor(
        public navCtrl: NavController,
        public formBuilder: FormBuilder,
        public loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        private _capelliApiService: CapelliApiService,
        private _dbStorage: DbStorage,
        private _alertCtrl: AlertController,
        private _formBuilder: FormBuilder,
        private _loadingController: LoadingController,
        private _platform: Platform
    ) {
        this._platform.ready().then(() => {
            GoogleAnalytics.trackView("Sign Up");
        });
        const emailReg = '^[a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,15})$';

        // Create the form group for validation and binding
        this.accountForm = this._formBuilder.group({
            'email': ['', Validators.compose([Validators.required, Validators.pattern(emailReg)])],
            'forename': ['', Validators.compose([Validators.required, Validators.minLength(2)])],
            'surname': ['', Validators.compose([Validators.required, Validators.minLength(2)])],
            'mobile': ['', Validators.compose([Validators.required, Validators.minLength(11), Validators.maxLength(11)])],
            'password': ['', Validators.compose([Validators.required, Validators.minLength(3)])],
            'passwordConfirm': ['', Validators.compose([Validators.required, Validators.minLength(3)])],
            'code': ['', Validators.compose([Validators.minLength(2)])],
        });

        // Assign the controls to variables for easy access later
        this.email = <FormControl>this.accountForm.controls['email'];
        this.password = <FormControl>this.accountForm.controls['password'];
        this.passwordConfirm = <FormControl>this.accountForm.controls['passwordConfirm'];
        this.forename = <FormControl>this.accountForm.controls['forename'];
        this.surname = <FormControl>this.accountForm.controls['surname'];
        this.mobile = <FormControl>this.accountForm.controls['mobile'];
        this.code = <FormControl>this.accountForm.controls['code'];

        this.email.valueChanges.debounceTime(1000).subscribe((value: string) => {
            console.log(`Email changed to "${value}", checking...`);
            this._capelliApiService.getEmailStatus(value).subscribe(result => {
                this.emailStatus = result.status;
            });
        });
    }

    public onSubmit() {
        GoogleAnalytics.trackEvent('Register', 'Clicked', 'Registered new user');
        // Save the username and password that were entered, no need to bind to the promise as we're not waiting on the completion
        //     this._dbStorage.setKey('username', this.username.value);
        //     this._dbStorage.setKey('password', this.password.value);

        //     // Display a loader so the user gets some feedback that a time-consuming operation may start
        let loader = this._loadingController.create({ content: 'Creating account...' });
        loader.present();

        let userCreationDto: UserCreationDto = {
            email: this.email.value,
            forename: this.forename.value,
            surname: this.surname.value,
            mobile: this.mobile.value,
            password: this.password.value,
            code: this.code.value
        };

        this._capelliApiService.createUser(userCreationDto)
            .subscribe(createResponse => {
                // Remove the spinner before continuing and navigating or displaying a login failure
                loader.dismiss().then(() => {
                    // Go and get a token using the new credentials
                    this._capelliApiService.getAndSaveUserToken(this.email.value, this.password.value)
                        .subscribe(loginResponse => {
                            // Remove the spinner before continuing and navigating or displaying a login failure
                            loader.dismiss().then(() => {
                                if (loginResponse.wasSuccessful) {
                                    this.navCtrl.setRoot(HomePage);
                                } else {
                                    this._alertCtrl.create(
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
                                this._alertCtrl.create({ title: 'Error logging in', message: error.errorMessage, buttons: ['OK'] }).present();
                            });
                        }
                        ); // subscribe



                    return this.navCtrl.pop();
                });
            }, // subscribe success
            error => {
                console.error(error);
                loader.dismiss().then(() => {
                    this._alertCtrl.create({ title: 'Error creating user', message: error.errorMessage, buttons: ['OK'] }).present();
                });
            }
            ); // subscribe
    }
    goToLogin() {
        this.navCtrl.pop();
    }
}