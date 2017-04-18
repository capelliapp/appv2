import { Subscribable } from 'rxjs/Observable';
import { isTrueProperty } from 'ionic-angular/util/util';
import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, ModalController, LoadingController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Platform } from 'ionic-angular';
import { HttpModule, Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Rx';
import { CapelliApiService } from '../../providers/capelli-api-service';
import { Results } from '../results/results';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  postcode: string;
  latitude: number;
  longitude: number;
  postcodeValid: boolean;
  isValid: boolean;

  constructor(
    public navCtrl: NavController,
    private platform: Platform,
    private geolocation: Geolocation,
    private http: Http,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public _loadingCtrl: LoadingController,
    private _capelliApiService: CapelliApiService,
  ) {
    this.postcode = null;
    this.postcodeValid = true;
  }

  getCurrentLocation() {
    console.log('Trying to get users loaction');
    //get the users current geoposition
    //First check if the users allowed geolocation

        // get current position
      this.geolocation.getCurrentPosition().then((resp) => {
          return this.reverseGeoCode(resp.coords.latitude, resp.coords.longitude);
        }).catch((error) => {
          console.log('Error getting location', error);
      });
  }

  public submitSearch() {
     if(this.postcode === null || this.postcode === '') {
      console.log('postcode empty');
      return this.postcodeValid = false;
    } else {
    this.validatePostcode();
    }
    if(this.postcodeValid) {
      this.navResults();
    } else {
      console.log('invalid postcode');
    }
  }

  private validatePostcode() {
    // Is postcode blank?
   
      let url = 'https://api.postcodes.io/postcodes/' + this.postcode;
      this.http.get(url).map(res => res.json()).subscribe(data => {
        if(data.status === 200) {
          this.latitude = data.result.latitude;
          this.longitude = data.result.longitude;
          this.postcodeValid = true;
          return this.postcodeValid = true;
        }
        else {
          return this.postcodeValid = false;
        }
    });
  }

  private reverseGeoCode(latitude, longitude){
    //Return the postcode from lat long
    console.log(latitude, longitude)
    let url = 'https://api.postcodes.io/postcodes?lon=' + longitude + '&lat=' + latitude;
    this.http.get(url).map(res => res.json()).subscribe(data => {
        if(data.result.status = 200) {
          this.postcodeValid = true;
          this.postcode = data.result[0].postcode;
        }
        else {
          this.postcodeValid = false;
          this.postcode = null;
        }
    });
    return this.postcode;
  }

  public navResults() {
        // GoogleAnalytics.trackEvent('Search', 'Searched', this.selectedAddress);

        let loading = this._loadingCtrl.create({
            content: 'Searching for your barber...',
            dismissOnPageChange: true
        });
        loading.present();
        try {
            this._capelliApiService.getAvailableBarbers(this.latitude, this.longitude, null, null, 60, null).subscribe(
                response => {
                    console.log(response);
                    loading.dismiss().then(() => {
                        if (response.length < 1) {
                            this.alertCtrl.create({ title: 'Sorry', subTitle: 'No barbers were found. We have logged your request and will be finding great barbers for this area soon!' }).present();
                        } else {
                            this.navCtrl.push(Results, { barbers: response, price: null, address: null, displayprice: null, qty: null });
                        }
                    });
                },
                error => {
                    console.error(error);
                    loading.dismiss().then(() => { this.alertCtrl.create({ title: 'Error', subTitle: 'Failed to find barbers.' }).present(); });
                }
            );
        } catch (error) {
            console.error(error);
            loading.dismiss();
            throw error;
        }
    }

}
