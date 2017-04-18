import { Injectable } from '@angular/core';
import { Platform, Events, AlertController } from 'ionic-angular';
import { Geolocation, Geoposition } from 'ionic-native';
import moment from 'moment';

@Injectable()
export class CapelliLocationService {

    private _cachedGeoposition: Geoposition = null;
    private _cacheExpires: moment.Moment;
    private _cacheMaxAgeSeconds: number = 30;
    private _displayedAlert: boolean = false;

    constructor(
        public _platform: Platform,
        private _events: Events,
        private _alertController: AlertController
    ) {
        // The cache starts off as expired
        this._cacheExpires = moment.utc().add(-5, 'minutes');
        this.getLocation();
    }

    public getLocation(forceRefresh: boolean = false): Promise<Geoposition> {
        return new Promise<Geoposition>((resolve, reject) => {
            try {
                // If the cache has not expired and we have a cached geoposition then return it
                if (!forceRefresh && this._cachedGeoposition && this._cacheExpires.isAfter(moment.utc())) {
                    // Already had a recent position
                    console.log(`GbgLocationService: Cached location expires in ${this._cacheExpires.diff(moment.utc(), 'seconds')}s: ${this._cachedGeoposition.coords.latitude}, ${this._cachedGeoposition.coords.longitude}`);
                    resolve(this._cachedGeoposition);
                    return;
                }
                // Must get the position
                Geolocation.getCurrentPosition().then(geoposition => {
                    // Cache the geoposition
                    this.cacheGeoPosition(geoposition);
                    console.log(`GbgLocationService: Location found: ${geoposition.coords.latitude}, ${geoposition.coords.longitude}`);
                    resolve(geoposition);
                    return;
                }).catch(positionError => {
                    let message = `GbgLocationService: Error obtaining location - ${positionError.code}: ${positionError.message}`;
                    if (!this._displayedAlert) {
                        this._alertController.create({
                            title: 'GeoLocation error',
                            subTitle: 'Setting to Hitchin',
                            message: message,
                            buttons: ['Dismiss']
                        }).present();
                        this._displayedAlert = true;
                    }
                    let geoposition: Geoposition = {
                        coords: {
                            latitude: 51.9492,
                            longitude: -0.2834,
                            accuracy: 20,
                            altitude: 1,
                            altitudeAccuracy: 20,
                            heading: 0,
                            speed: 0
                        },
                        timestamp: Date.now()
                    };
                    this.cacheGeoPosition(geoposition);
                    console.log(message);
                    resolve(geoposition);
                    // reject(positionError);
                });
            } catch (error) {
                reject(error);
            }
        });
    }
    private cacheGeoPosition(geoposition: Geoposition) {
        this._cachedGeoposition = geoposition;
        this._cacheExpires = moment.utc().add(this._cacheMaxAgeSeconds, 'seconds');
    }
}
