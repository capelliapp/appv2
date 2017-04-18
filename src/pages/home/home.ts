import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { Platform } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  postcode: string;
  latitude: number;
  longitude: number;

  constructor(
    public navCtrl: NavController,
    private platform: Platform,
    private geolocation: Geolocation,
    private http: Http
  ) {
    this.postcode = null;
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

  private reverseGeoCode(latitude, longitude){
    //Return the postcode from lat long
    console.log(latitude, longitude)
    let url = 'api.postcodes.io/postcodes?lon=' + longitude + '&lat=' + latitude;
    this.http.get(url).map(res => res.json()).subscribe(data => {
        this.postcode = data;
    });
    // this.postcode = 'SG4 OHW';
    console.log(this.postcode);
    return this.postcode;
  }

}
