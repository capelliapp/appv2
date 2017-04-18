import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { ApiResponse } from './apiResponse';
import { StoredLoginDetails } from './storedLoginDetails.model';
import * as AppSettings from '../environment';
import moment from 'moment';
import { StoredClientToken } from './storedClientToken.model';
import { DbStorage } from './dbStorage';
import { UserCreationDto } from './userCreationDto.model';
import { Events } from 'ionic-angular';


@Injectable()
export class CapelliApiService {
    public static DefaultAvatarUrl: string = 'assets/img/anonymous-avatar.png';
    private apiUserBaseUrl = AppSettings.CapelliApiUrl + '/v1/users';
    // Constants
    private apiAuthenticationUrl = AppSettings.CapelliApiUrl + '/access_token';
    // private apiPostCommentsUrl = this.apiPostUrl + '/comments';
    private apiProfileDetailsUrl = AppSettings.CapelliApiUrl + '/v1/users/#USERID#';
    private apiUserAvatarUrl = AppSettings.CapelliApiUrl + '/v1/users/#USERID#/avatar';
    private apiUserUrl = AppSettings.CapelliApiUrl + '/v1/users/#USERID#';
    private apiFindBarbersUrl = AppSettings.CapelliApiUrl + '/v1/barbers/available';
    private apiBarberFavsUrl = AppSettings.CapelliApiUrl + '/v1/user/favourites';
    private apiBarbersNearbyUrl = AppSettings.CapelliApiUrl + '/v1/barbers/nearby';
    private apiBarberBookingsUrl = AppSettings.CapelliApiUrl + '/v1/barbers/bookings';
    private apiUserBookingsUrl = AppSettings.CapelliApiUrl + '/v1/users/bookings';

    private apiMakeBookingsUrl = AppSettings.CapelliApiUrl + '/v1/bookings/create';
    // private apiUploadAvatarUrl = AppSettings.CapelliApiUrl + '/v1/users/#USERID#/avatar'
    private apiEmailStatusUrl = AppSettings.CapelliApiUrl + '/v1/emailstatus/#EMAIL#';
    private apiUsernameStatusUrl = AppSettings.CapelliApiUrl + '/v1/usernamestatus/#USERNAME#';

    private apiGetBarberRevieswUrl = AppSettings.CapelliApiUrl + '/v1/barbers/reviews/#BARBERID#';

    private apiBarberBookingActionUrl = AppSettings.CapelliApiUrl + '/v1/barber/booking/action';

    private apiBarberFavUrl = AppSettings.CapelliApiUrl + '/v1/barber/#USERID#/favourite';
    private apiAddTokenUrl = AppSettings.CapelliApiUrl + '/v1/user/devicetokens';
    private apiGetCardsUrl = AppSettings.CapelliApiUrl + '/v1/user/cards';
    private apiDeleteCardUrl = AppSettings.CapelliApiUrl + '/v1/user/deletecard';
    private apiAddCardUrl = AppSettings.CapelliApiUrl + '/v1/user/addcard';

    private apiGetBarberBalanceUrl = AppSettings.CapelliApiUrl + '/v1/barbers/balance';
    private apiAddReviewUrl = AppSettings.CapelliApiUrl + '/v1/user/booking/addreview';
    private apiAddCreditUrl = AppSettings.CapelliApiUrl + '/v1/user/addcredit';

    private apiGetUserBalanceUrl = AppSettings.CapelliApiUrl + '/v1/user/balance';


    // Private variables

    // Public  variables
    public errorMessage: string;
    public loginDetails: StoredLoginDetails;
    public clientToken: StoredClientToken = new StoredClientToken();
    public profileInfo: any;

    // Constructor
    constructor(
        private http: Http,
        private _dbStorage: DbStorage,
        public event: Events,
    ) {
        console.log('CapelliApiService: constructor');
    }
    public loadProfile() {
        try {
            this.getProfile(null).subscribe(
                response => {
                    this.profileInfo = response;
                    this.event.publish('profile:loaded');

                },
                error => {
                    // console.error(error);
                }
            );
        } catch (error) {
            // console.error(error);
            throw error;
        }
    }


    public tryAndLoginUsingSavedLoginDetails(): Promise<boolean> {
        let apiInstance = this;
        return new Promise(function (resolve, reject) {
            try {
                // Try and load saved login details
                apiInstance._dbStorage.getKey('loginDetails')
                    .then(loginDetailsJson => {
                        if (loginDetailsJson) {
                            try {
                                apiInstance.loadLoginDetailsFromJson(loginDetailsJson);
                                // Has the token expired?
                                if (apiInstance.loginDetails.expiresOnDatetime) {
                                    apiInstance.ensureValidUserToken()
                                        .subscribe(
                                        result => {
                                            console.log('Token is valid');
                                            return resolve(true);
                                        },
                                        error => {
                                            console.log('Could not ensure token is valid');
                                            return resolve(false);
                                        }
                                        );
                                }

                            } catch (error) {
                                // We didn't manage to load the login details
                                return resolve(false);
                            }
                            // return resolve(true);
                        } else {
                            console.log('CapelliApiService: No saved token.');
                            return resolve(false);
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            } catch (error) {
                return reject(error);
            }
        });
    }

    public getEmailStatus(email: string): Observable<any> {
        let url = this.apiEmailStatusUrl.replace(/#EMAIL#/, email);
        return this.getApiResourceWithoutUser(url);
    }

    public getUsernameStatus(username: string): Observable<any> {
        let url = this.apiUsernameStatusUrl.replace(/#USERNAME#/, username);
        return this.getApiResourceWithoutUser(url);
    }
    public createUser(user: UserCreationDto): Observable<any> {
        return this.postApiResourceWithoutUser(this.apiUserBaseUrl, JSON.stringify(user));
    }

    private getApiResourceWithoutUser(url: string): Observable<any> {
        // Ensure we have a valid token before we do the request
        return this.ensureValidClientToken().flatMap(() => {
            console.log(`CapelliApiService: making api NO AUTH GET request for ${url}`);
            return this.http
                .get(url, this.CalculateNoAuthRequestOptions())
                .map(response => {
                    console.log(`CapelliApiService: Mapping response for ${url}`);
                    // Need to check there is a response before calling .json otherwise an error will occur
                    return response.text() === '' ? '' : response.json();
                })
                .catch(this.handleError);
        });
    }
    private ensureValidUserToken(): Observable<any> {
        // Check we have loginDetails and that we're before the time they expire
        console.log('Ensuring we have a valid token');
        if (this.loginDetails) {
            if (this.loginDetails.expiresOnDatetime && moment.utc().isBefore(this.loginDetails.expiresOnDatetime)) {
                console.log('Token is still valid');
                // Return an empty observable to keep the chain
                return Observable.from([true]);
                // return Observable.empty();
            } else {
                console.log('Trying to get a new token using saved credentials');
                // Token has expired, need to get a new token
                // Get the username and password out of storage
                let getUsername = Observable.fromPromise(this._dbStorage.getKey('username'));
                let getPassword = Observable.fromPromise(this._dbStorage.getKey('password'));
                // Need to do some special handling here as otherwise a Promise.all would skip returning any values to the subscribe

                return getUsername.flatMap(username => {
                    return getPassword.flatMap(password => {
                        console.log('Examining credentials');
                        if (!username || !password) {
                            this.clearLoginDetails();
                            return Observable.throw('Could not retrieve credentials from storage');
                        }
                        console.log('Trying to get and save a new token using credentials');
                        return this.getAndSaveUserToken(username, password).flatMap(loginResponse => {
                            console.log(`Got new token. API Response: ${JSON.stringify(loginResponse)}`);
                            // Return an empty observable to keep the chain
                            return Observable.from([true]);
                            // return Observable.empty();
                        }
                        ).catch((error) => {
                            console.error(`Returning error while trying to get new token: ${JSON.stringify(error)}`);
                            return Observable.throw('Could not retrieve credentials from storage');
                        });
                    });
                });
            }
        } else {
            // No loginDetails
            console.log('Could not determine whether token is valid');
            return Observable.throw('Make API request called before logged in.');
        }
    }

    private postApiResourceWithoutUser(url: string, body: string): Observable<any> {
        // Ensure we have a valid token before we do the request
        return this.ensureValidClientToken().flatMap(() => {
            console.log(`CapelliApiService: making api NO AUTH POST request for ${url}`);
            return this.http
                .post(url, body, this.CalculateNoAuthRequestOptions())
                .map(response => {
                    console.log(`CapelliApiService: Mapping response for ${url}`);
                    // Need to check there is a response before calling .json otherwise an error will occur
                    return response.text() === '' ? '' : response.json();
                })
                .catch(this.handleError);
        });
    }
    private ensureValidClientToken(): Observable<any> {
        // Check we have loginDetails and that we're before the time they expire
        console.log('Ensuring we have a valid client token');
        if (this.clientToken.expiresOnDatetime && moment.utc().isBefore(this.clientToken.expiresOnDatetime)) {
            console.log('Client token is still valid');
            // Return an empty observable to keep the chain
            return Observable.from([true]);
        } else {
            // Token has expired, need to get a new token
            // Need to do some special handling here as otherwise a Promise.all would skip returning any values to the subscribe
            console.log('Trying to get and save a new token');
            return this.getAndSaveClientToken().flatMap(loginResponse => {
                console.log(`Got new token. API Response: ${JSON.stringify(loginResponse)}`);
                // Return an empty observable to keep the chain
                return Observable.from([true]);
            }
            ).catch((error) => {
                console.error(`Returning error while trying to get new token: ${JSON.stringify(error)}`);
                return Observable.throw('Could not retrieve credentials from storage');
            });
        }
    }
    public getAndSaveClientToken(): Observable<ApiResponse> {
        let tokenRequestBody = JSON.stringify(
            {
                'client_id': AppSettings.CapelliApiClientId,
                'client_secret': AppSettings.CapelliApiClientSecret,
                'grant_type': 'client_credentials',
                'scope': 'capelli',
            }
        );
        let tokenHeaders = new Headers({ 'Content-Type': 'application/json' });
        let tokenOptions = new RequestOptions({ headers: tokenHeaders });
        return this.http
            .post(this.apiAuthenticationUrl, tokenRequestBody, tokenOptions)
            .map(response => this.extractAndSaveClientToken(response, this))
            .catch(this.handleError);
    }
    public getAndSaveUserToken(username: string, password: string): Observable<ApiResponse> {
        let tokenRequestBody = JSON.stringify(
            {
                'client_id': AppSettings.CapelliApiClientId,
                'client_secret': AppSettings.CapelliApiClientSecret,
                'grant_type': 'password',
                'scope': 'capelli',
                'username': username,
                'password': password
            }
        );
        let tokenHeaders = new Headers({ 'Content-Type': 'application/json' });
        let tokenOptions = new RequestOptions({ headers: tokenHeaders });
        return this.http
            .post(this.apiAuthenticationUrl, tokenRequestBody, tokenOptions)
            .map(response => this.extractAndSaveUserToken(response, this))
            .catch(this.handleError);
    }
    // Extracts an OAUTH token from an HTTP Response
    private extractAndSaveUserToken(response: Response, capelliApiService: CapelliApiService): ApiResponse {
        console.log('CapelliApiService: extracting token');
        // Get the response as json
        let tokenJson = response.json();

        if (!tokenJson.access_token) {
            throw new Error('access_token not found in returned API repsonse');
        }
        if (!tokenJson.user_id) {
            throw new Error('user_id not found in returned API response');
        }

        // Save the login details
        capelliApiService.saveLoginDetails(tokenJson);

        let apiResponse = new ApiResponse();
        apiResponse.wasSuccessful = response.status === 200;
        apiResponse.httpStatusCode = response.status;
        apiResponse.errorMessage = tokenJson.error_description;
        return apiResponse;
    }
    private extractAndSaveClientToken(response: Response, capelliApiService: CapelliApiService): ApiResponse {
        console.log('CapelliApiService: extracting token');
        // Get the response as json
        let tokenJson = response.json();

        if (!tokenJson.access_token) {
            throw new Error('access_token not found in returned API repsonse');
        }

        // Save the login details
        capelliApiService.saveClientToken(tokenJson);

        let apiResponse = new ApiResponse();
        apiResponse.wasSuccessful = response.status === 200;
        apiResponse.httpStatusCode = response.status;
        apiResponse.errorMessage = tokenJson.error_description;
        return apiResponse;
    }
    private saveClientToken(tokenJson: any) {
        // To be on the safe side, take 5 minutes off the expires_in seconds
        let expiresInSeconds: number = tokenJson.expires_in;
        if (expiresInSeconds > 300) {
            expiresInSeconds -= 300;
        }
        let clientToken: StoredClientToken = {
            apiToken: tokenJson.access_token,
            expiresOnDatetime: moment.utc().add(expiresInSeconds, 'seconds').format('YYYY-MM-DD HH:mm:ss')
        };

        console.log(`CapelliApiService: Saving clientToken for token due to expire on ${clientToken.expiresOnDatetime}`);
        this._dbStorage.setKey('clientToken', JSON.stringify(clientToken));

        // Store locally
        this.clientToken = clientToken;
    }
    private CalculateNoAuthRequestOptions(): RequestOptions {
        let tokenHeaders = new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.clientToken.apiToken });
        return new RequestOptions({ headers: tokenHeaders });
    }
    public getAndSaveToken(username: string, password: string): Observable<ApiResponse> {
        let tokenRequestBody = JSON.stringify(
            {
                'client_id': AppSettings.CapelliApiClientId,
                'client_secret': AppSettings.CapelliApiClientSecret,
                'grant_type': 'password',
                'scope': 'capelli',
                'username': username,
                'password': password
            }
        );
        let tokenHeaders = new Headers({ 'Content-Type': 'application/json' });
        let tokenOptions = new RequestOptions({ headers: tokenHeaders });
        return this.http
            .post(this.apiAuthenticationUrl, tokenRequestBody, tokenOptions)
            .map(response => this.extractAndSaveToken(response, this))
            .catch(this.handleError);
    }



    public getProfile(userId: number): Observable<any> {
        if (userId === null) { userId = this.loginDetails.userId; } // If no userId is provided then use the currently logged in user
        console.log('CapelliApiService: fetching profile details');
        let profileUrl: string = this.apiProfileDetailsUrl.replace(/#USERID#/, userId.toString());
        return this.getApiResource(profileUrl);
    }
    public getBarberBookings(userId: number): Observable<any> {
        if (userId === null) { userId = this.loginDetails.userId; } // If no userId is provided then use the currently logged in user
        console.log('CapelliApiService: fetching barber bookings');
        let getBookingsUrl = this.apiBarberBookingsUrl;
        return this.getApiResource(getBookingsUrl);
    }
    public getUserBookings(userId: number): Observable<any> {
        if (userId === null) { userId = this.loginDetails.userId; } // If no userId is provided then use the currently logged in user
        console.log('CapelliApiService: fetching user bookings');
        let getBookingsUrl = this.apiUserBookingsUrl;
        return this.getApiResource(getBookingsUrl);
    }
    public getBarberReviews(barberid): Observable<any> {
        console.log('capelliApiService: Getting barber reviews for ${barberid}')
        let url = this.apiGetBarberRevieswUrl.replace(/#BARBERID#/, barberid)
        return this.getApiResource(url);
    }
    public getFavorites(): Observable<any> {
        // if (userId === null){ userId = this.loginDetails.userId;} // If no userId is provided then use the currently logged in user
        console.log('CapelliApiService: fetching Favs');
        let favUrl = this.apiBarberFavsUrl;
        return this.getApiResource(favUrl);
    }

    public getBaberBalance(): Observable<any> {
        console.log('capelliApiService: Getting Barbers Balance');
        return this.getApiResource(this.apiGetBarberBalanceUrl);
    }
    public getUsersBalance(): Observable<any> {
        console.log('capelliApiService: Getting Users Balance');
        return this.getApiResource(this.apiGetUserBalanceUrl);
    }

    public addReview(newReview, booking_id, review_image): Observable<any> {
        console.log('capelliApiService: Adding Review');
        let postBody = JSON.stringify({ booking_id: booking_id, review_text: newReview.review_text, review_image_data: review_image, review_rating: newReview.review_rating });
        return this.postApiResource(this.apiAddReviewUrl, postBody);
    }

    public addCredit(code): Observable<any> {
        console.log('capelliApiService: Adding coupon credit');
        let postBody = JSON.stringify({ code: code });
        return this.postApiResource(this.apiAddCreditUrl, postBody);
    }
    public getResetToken(email): Observable<any> {
        console.log(email);
        let url = AppSettings.CapelliApiUrl + '/v1/users/passwordresetcode';
        let postBody = JSON.stringify({ email: email });
        return this.postApiResourceWithoutUser(url, postBody);
    }

    public requestPasswordResetCode(email: string): Observable<any> {
        console.log(`Requesting password reset code for email ${email}.`);
        let url = AppSettings.CapelliApiUrl + '/v1/users/passwordresetcode';
        let body = JSON.stringify({ email: email });
        return this.postApiResourceWithoutUser(url, body);
    }

    public getAdressDetails(postcode: string, house: string): Observable<any> {
        let url = 'https://api.getAddress.io/v2/uk/#POSTCODE#/#NUMBER#?format=true&api-key=dI1fBRyK1UqWj6rPsYxwBg6733';
        let postcodeUrl: string = url.replace(/#POSTCODE#/, postcode);
        let getUrl: string = postcodeUrl.replace(/#NUMBER#/, house);
        return this.getApiResourceAddress(getUrl);
    }

    public resetPassword(email: string, code: string, password: string): Observable<any> {
        console.log(`Requesting password reset for email ${email}.`);
        let url: string = AppSettings.CapelliApiUrl + '/v1/users/password';
        let body = JSON.stringify({ code, email, password });
        return this.postApiResourceWithoutUser(url, body);
    }

    public getCards(): Observable<any> {
        console.log('capelliApiService: Fetching Cards')
        let cardsUrl = this.apiGetCardsUrl;
        return this.getApiResource(cardsUrl);
    }
    public getTentative(): Observable<any> {
        let url: string = AppSettings.CapelliApiUrl + '/v1/barbers/tenative';
        return this.getApiResource(url);
    }
    public addCard(newCard): Observable<any> {
        console.log('capelliApiService: Adding Card')
        let addCardsUrl = this.apiAddCardUrl;
        let postBody = JSON.stringify({ card_number: newCard.number, cvc: newCard.cvc, exp_month: newCard.exp_month, exp_year: newCard.exp_year });
        return this.postApiResource(addCardsUrl, postBody);
    }
    public deleteCard(card_token): Observable<any> {
        console.log('capelliApiService: Fetching Cards')
        let deleteCardUrl = this.apiDeleteCardUrl;
        let postBody = JSON.stringify({ card_token: card_token });
        return this.postApiResource(deleteCardUrl, postBody);
    }


    public isFavorite(barberId: number) {
        console.log('CapelliApiService: checking if barber is fav');
        let favUrl: string = this.apiBarberFavUrl.replace(/#USERID#/, barberId.toString());
        return this.getApiResource(favUrl);
    }

    public addFavorite(barberId: number) {
        console.log('CapelliApiService: adding barber as fav');
        let favUrl: string = this.apiBarberFavUrl.replace(/#USERID#/, barberId.toString());
        return this.postApiResource(favUrl, null);
    }
    public addPushToken(token) {
        console.log('CapelliApiService: adding push token');
        let addTokenUrl = this.apiAddTokenUrl;
        let postBody = JSON.stringify({ device_token: token });
        return this.postApiResource(addTokenUrl, postBody);
    }

    public removeFavorite(barberId: number) {
        console.log('CapelliApiService: removing barber as fav');
        let favUrl: string = this.apiBarberFavUrl.replace(/#USERID#/, barberId.toString());
        return this.deleteApiResource(favUrl);
    }

    public isCurrentUserId(userId: number) {
        // Returns true if the provided userId is the current user
        return this.loginDetails.userId === userId;
    }

    public updateAvatar(imageData: string): Observable<any> {
        console.log('Updating the avatar');
        let userId = this.loginDetails.userId;
        let avatarUrl: string = this.apiUserAvatarUrl.replace(/#USERID#/, userId.toString());
        let avatarBody = JSON.stringify({ avatar_image_data: imageData });
        return this.postApiResource(avatarUrl, avatarBody);
    }

    public barberActionBooking(booking_id: string, action: string): Observable<any> {
        console.log('Updating booking');
        console.log(booking_id);
        let bookingActionUrl = this.apiBarberBookingActionUrl;
        let postBody = JSON.stringify({ action: action, booking_id: booking_id });
        console.log(bookingActionUrl);
        return this.postApiResource(bookingActionUrl, postBody);
    }

    public updateProfile(forename: string, surname: string, imageData: string): Observable<any> {
        // We can only update our own profile
        let userId = this.loginDetails.userId;

        let profileUrl: string = this.apiUserUrl.replace(/#USERID#/, userId.toString());
        let profileBody = JSON.stringify({
            forname: forename,
            surname: surname,
        });

        if (imageData != null) {
            console.log('Updating the profile and avatar');
            let avatarUrl: string = this.apiUserAvatarUrl.replace(/#USERID#/, userId.toString());
            let avatarBody = JSON.stringify({ avatar_image_data: imageData });

            // Handle uploading the new image on the save event below if _imageData is not null
            return Observable.forkJoin(
                this.postApiResource(profileUrl, profileBody),
                this.postApiResource(avatarUrl, avatarBody)
            );
        } else {
            // No imageData, just do the profile update
            console.log('Updating the profile. No need to update avatar');
            return this.postApiResource(profileUrl, profileBody);
        }
    }
    public makeBooking(start, end, barber_id, what, where, price, card, price_paid, qty): Observable<any> {
        console.log('CapelliApiService: making booking');
        let makeBookingUrl = this.apiMakeBookingsUrl;
        let requestBody = JSON.stringify({ calendar_id: barber_id, start: start, end: end, what: what, address: where, card_token: card, price: price, price_paid: price_paid, qty: qty });
        return this.postApiResource(makeBookingUrl, requestBody);
    }

    public getFaqs(): Observable<any> {
        console.log('CapelliApiService: getting FAQs');
        let faqsUrl = AppSettings.CapelliApiUrl + '/faqs';
        return this.getApiResource(faqsUrl);
    }
    public getNearBy(lat: string, lng: string): Observable<any> {
        // if (userId === null){ userId = this.loginDetails.userId;} // If no userId is provided then use the currently logged in user
        console.log('CapelliApiService: fetching Favs');
        let getNearUrl = this.apiBarbersNearbyUrl;
        let requestBody = JSON.stringify({ latitude: lat, longitude: lng });
        return this.postApiResource(getNearUrl, requestBody);
    }
    public getAvailableBarbers(latitude, longitude, start, day, length, calendar_id = null): Observable<any> {
        let searchBody = JSON.stringify({
            latitude: latitude,
            longitude: longitude,
            start: start,
            day: day,
            length: length,
            calendar_id: calendar_id
        })
        return this.postApiResource(this.apiFindBarbersUrl, searchBody);
    }
    // Helper methods ------------------------------------------

    private getApiResource(url: string): Observable<any> {
        // Ensure we have a valid token before we do the request
        return this.ensureValidUserToken().flatMap(() => {
            console.log(`CapelliApiService: making api GET request for ${url}`);
            return this.http
                .get(url, this.CalculateRequestOptions())
                .map(response => {
                    console.log(`CapelliApiService: Mapping response for ${url}`);
                    // Need to check there is a response before calling .json otherwise an error will occur
                    return response.text() === '' ? '' : response.json();
                })
                .catch(this.handleError);
        });
    }
    private getApiResourceAddress(url: string): Observable<any> {
        // Ensure we have a valid token before we do the request
        console.log(`CapelliApiService: making api GET request for ${url}`);
        return this.http
            .get(url, this.CalculateRequestOptionsAddress())
            .map(response => {
                console.log(`CapelliApiService: Mapping response for ${url}`);
                // Need to check there is a response before calling .json otherwise an error will occur
                return response.text() === '' ? '' : response.json();
            })
            .catch(this.handleError);
    }

    private postApiResource(url: string, body: string) {
        // Ensure we have a valid token before we do the request
        return this.ensureValidUserToken().flatMap(() => {
            console.log(`CapelliApiService: making api POST request for ${url}`);
            return this.http
                .post(url, body, this.CalculateRequestOptions())
                .map(response => {
                    console.log(`CapelliApiService: Mapping response for ${url}`);
                    // Need to check there is a response before calling .json otherwise an error will occur
                    return response.text() === '' ? '' : response.json();
                })
                .catch(this.handleError);
        });
    }

    private deleteApiResource(url: string) {
        // Ensure we have a valid token before we do the request
        return this.ensureValidUserToken().flatMap(() => {
            console.log(`CapelliApiService: making api DELETE request for ${url}`);
            return this.http
                .delete(url, this.CalculateRequestOptions())
                .map((response) => {
                    console.log(`CapelliApiService: Mapping response for ${url}`);
                    // Need to check there is a response before calling .json otherwise an error will occur
                    return response.text() === '' ? '' : response.json();
                })
                .catch(this.handleError);
        });
    }


    // Extracts an OAUTH token from an HTTP Response
    private extractAndSaveToken(response: Response, CapelliApiService: CapelliApiService): ApiResponse {
        console.log('CapelliApiService: extracting token');
        // Get the response as json
        let tokenJson = response.json();

        if (!tokenJson.access_token) {
            throw new Error('access_token not found in returned API repsonse');
        }
        if (!tokenJson.user_id) {
            throw new Error('user_id not found in returned API response');
        }

        // Save the login details
        CapelliApiService.saveLoginDetails(tokenJson);

        let apiResponse = new ApiResponse();
        apiResponse.wasSuccessful = response.status === 200;
        apiResponse.httpStatusCode = response.status;
        apiResponse.errorMessage = tokenJson.error_description;
        return apiResponse;
    }

    // Handles errors
    // See https://fetch.spec.whatwg.org/#response-class
    private handleError(error: any): Observable<ApiResponse> {
        console.error('CapelliApiService: handling error');
        let stringified = JSON.stringify(error);
        console.error(stringified); // log to console for debug

        if (error instanceof SyntaxError) {
            console.error('Error of type SyntaxError occurred during API request');
            let syntaxError = <SyntaxError>error;
            // Something probably went wrong parsing the json
            // Throw and return
            return Observable.throw(syntaxError.message);
        } else if (error instanceof Response) {
            console.error('Error of type Response occurred during API request');
            let errorResponse = <Response>error;
            // We have a response
            let apiResponse = new ApiResponse();
            apiResponse.wasSuccessful = false;
            apiResponse.httpStatusCode = errorResponse.status ? errorResponse.status : -1;

            let body = errorResponse.text() === '' ? '' : errorResponse.json();
            let errMsg = errorResponse.status ? `${errorResponse.status} - ${errorResponse.statusText}` : 'Communication error';
            apiResponse.errorMessage = body.error_description ? body.error_description : errMsg;

            // Return an observable that can be subscribed to, containing tha API response
            return Observable.throw(apiResponse);
            // return Observable.create(observer => {
            //   observer.next(apiResponse);
            //   observer.complete();
            // });
        } else {
            console.error('Error of unknown type occurred during API request');
            // Don't know what this is so just send back a stringified version
            return Observable.throw(stringified);
            // return Observable.create(observer => {
            //   observer.next(stringified);
            //   observer.complete();
            // });
        }
    }

    private loadLoginDetailsFromJson(loginDetails: string) {
        try {
            this.loginDetails = JSON.parse(loginDetails);
            console.log('CapelliApiService: Login details loaded from storage, not yet validated');
        } catch (error) {
            console.error('CapelliApiService: Login details failed to load');

            // Failed to load so clear out login details
            this.clearLoginDetails();

            // Rethrow whatever the problem was
            throw (error);
        }
    }

    private saveLoginDetails(tokenJson: any) {
        // To be on the safe side, take 5 minutes off the expires_in seconds
        let expiresInSeconds: number = tokenJson.expires_in;
        if (expiresInSeconds > 300) {
            expiresInSeconds -= 300;
        }
        let loginDetails: StoredLoginDetails = {
            apiToken: tokenJson.access_token,
            userId: tokenJson.user_id,
            expiresOnDatetime: moment.utc().add(expiresInSeconds, 'seconds').format('YYYY-MM-DD HH:mm:ss')
        };

        console.log(`CapelliApiService: Saving loginDetails for token due to expire on ${loginDetails.expiresOnDatetime}`);
        this._dbStorage.setKey('loginDetails', JSON.stringify(loginDetails));

        // Store locally
        this.loginDetails = loginDetails;
    }

    public clearLoginDetails() {
        // Remove the value from storage
        this._dbStorage.removeKey('loginDetails')
            .then(d => console.log(`Removed loginDetails: ${d}`))
            .catch(e => console.error(`Error removing loginDetails: ${e}`));

        // Clear out the password
        this._dbStorage.removeKey('password')
            .then(d => console.log(`Removed password: ${d}`))
            .catch(e => console.error(`Error removing password: ${e}`));

        // Clear out the variables
        this.loginDetails = null;

        console.log('Login details cleared from storage');
    }

    private CalculateRequestOptions(): RequestOptions {
        let tokenHeaders = new Headers({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.loginDetails.apiToken });
        return new RequestOptions({ headers: tokenHeaders });
    }
    private CalculateRequestOptionsAddress(): RequestOptions {
        let tokenHeaders = new Headers({ 'Content-Type': 'application/json' });
        return new RequestOptions({ headers: tokenHeaders });
    }
}
