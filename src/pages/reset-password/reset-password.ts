import {
    NavController,
    LoadingController,
    AlertController
} from 'ionic-angular';
import { Component } from '@angular/core';
import { FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { CapelliApiService } from '../../providers/capelli-api-service';
import { ApiResponse } from '../../providers/apiResponse';
import { Login } from '../login/login';
import { HomePage } from '../home/home';

@Component({
    selector: 'page-reset-password',
    templateUrl: 'reset-password.html',
})
export class ResetPassword {
    // For local storage of username
    public email: FormControl;
    public code: FormControl;
    public password: FormControl;
    public passwordConfirm: FormControl;
    public accountForm: FormGroup;

    constructor(
        private _navCtrl: NavController,
        private _formBuilder: FormBuilder,
        private _loadingController: LoadingController,
        private _capeliApiService: CapelliApiService,
        private _alertCtrl: AlertController
    ) {
        const emailReg = '.+@.+\..+'; // ^ and $ are automatically added
        // Create the form group for validation and binding
        this.accountForm = this._formBuilder.group({
            'email': ['', Validators.compose([Validators.required, Validators.pattern(emailReg)])],
            'code': ['', Validators.compose([Validators.required, Validators.minLength(6)])],
            'password': ['', Validators.compose([Validators.required, Validators.minLength(3)])],
            'passwordConfirm': ['', Validators.compose([Validators.required, Validators.minLength(3)])]
        });

        // Assign the controls to variables for easy access later
        this.email = <FormControl>this.accountForm.controls['email'];
        this.code = <FormControl>this.accountForm.controls['code'];
        this.password = <FormControl>this.accountForm.controls['password'];
        this.passwordConfirm = <FormControl>this.accountForm.controls['passwordConfirm'];
    }

    public onSubmit() {
        let message: string = '';
        let haveCode = this.accountForm.valid;
        if (haveCode) {
            message = 'Validating...';
        } else {
            message = 'Requesting reset code...';
        }
        console.log(message);
        let loader = this._loadingController.create({ content: message });
        loader.present();

        if (haveCode) {
            // Try submitting the email, code and new password
            this._capeliApiService.resetPassword(this.email.value, this.code.value, this.password.value)
                .subscribe(requestResponse => {
                    // Remove the spinner before continuing and navigating or displaying a login failure
                    loader.dismiss().then(() => {
                        console.log('Password updated');
                        this._alertCtrl.create({ title: 'Password updated', buttons: ['OK'] }).present();
                        this.loginAndNavToLoading();
                        return;
                    });
                }, // subscribe success
                error => {
                    console.error(error);
                    let message: string = '';
                    if (error.httpStatusCode === 422) {
                        // Error message will be made up from response body
                        if (error.response.email && error.response.email.length > 0) {
                            message = error.response.email[0];
                        } else if (error.response.code && error.response.code.length > 0) {
                            message = error.response.code[0];
                        } else if (error.response.password && error.response.password.length > 0) {
                            message = error.response.password[0];
                        }
                    } else {
                        message = error.errorMessage;
                    }
                    loader.dismiss().then(() => {
                        let errorAlert = this._alertCtrl.create({ title: 'Error', message: message, buttons: ['OK'] });
                        errorAlert.present();
                    });
                }
                ); // subscribe
        } else {
            // Going to submit email to request a code
            this._capeliApiService.requestPasswordResetCode(this.email.value)
                .subscribe(requestResponse => {
                    // Remove the spinner before continuing and navigating or displaying a login failure
                    loader.dismiss().then(() => {
                        console.log('Requested reset code complete');
                        this._alertCtrl.create({ title: 'Code emailed', buttons: ['OK'] }).present();
                    });
                }, // subscribe success
                (error: ApiResponse) => {
                    console.error(error);
                    let message: string = '';
                    if (error.httpStatusCode === 422) {
                        // Error message will be made up from response body
                        message = error.response.email[0];
                    } else {
                        message = error.errorMessage;
                    }
                    loader.dismiss().then(() => {
                        let errorAlert = this._alertCtrl.create({ title: 'Error', message: message, buttons: ['OK'] });
                        errorAlert.present();
                    });
                }
                ); // subscribe
        }
    }

    private loginAndNavToLoading() {
        // Go and get a token using the new credentials
        this._capeliApiService.getAndSaveUserToken(this.email.value, this.password.value)
            .subscribe(loginResponse => {
                // Remove the spinner before continuing and navigating or displaying a login failure
                if (loginResponse.wasSuccessful) {

                    // Send to the LoadingPage
                    this._navCtrl.setRoot(HomePage);
                    return;
                } else {
                    let errorAlert = this._alertCtrl.create(
                        {
                            title: 'Login failure',
                            subTitle: loginResponse.errorMessage,
                            buttons: ['OK']
                        }
                    );
                    errorAlert.present();
                    errorAlert.onDidDismiss(() => {
                        // Send back to the login page
                        this._navCtrl.setRoot(Login);
                    });
                }
            }, // subscribe success
            error => {
                console.error(error);
                let errorAlert = this._alertCtrl.create({ title: 'Error logging in', message: error.errorMessage, buttons: ['OK'] });
                errorAlert.present();
                errorAlert.onDidDismiss(() => {
                    // Send back to the login page
                    this._navCtrl.setRoot(Login);
                });
            }
            ); // subscribe    
    }

    public cancelPasswordReset() {
        this._navCtrl.setRoot(Login);
    }
}