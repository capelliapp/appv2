import { Component } from '@angular/core';

import { NavController, ViewController, NavParams, AlertController, LoadingController, ModalController, ToastController, Platform } from 'ionic-angular';
import { CapelliApiService } from '../../providers/capelli-api-service';
import { GoogleAnalytics } from 'ionic-native';
@Component({
    selector: 'page-results',
    templateUrl: 'results.html'
})
export class Results {
    public barbers: any;
    public resultsCount: number;
    public slotStart: string;
    public slotEnd: string;
    public barberName: string;
    public barberId: number;
    public barberarray: any;
    price: any;
    displayprice: any;
    address: string;
    qty: number;
    constructor(
        public navCtrl: NavController,
        public navParams: NavParams,
        private toastCtrl: ToastController,
        public modalCtrl: ModalController,
        public _loadingCtrl: LoadingController,
        public alertCtrl: AlertController,
        public viewController: ViewController,
        private _capelliApiService: CapelliApiService,
        private platform: Platform

    ) {
        this.platform.ready().then(() => {
            GoogleAnalytics.trackView("Results");
        });
        this.barbers = navParams.get('barbers');
        this.price = navParams.get('price');
        this.displayprice = navParams.get('displayprice');
        this.address = navParams.get('address');
        this.qty = navParams.get('qty');

        this.resultsCount = this.barbers.length;
        console.log(this.resultsCount);
        this.slotStart = 'None Selected';
        this.barberName = 'None Selected';
    }
    ionViewDidLoad() {
        if (this.resultsCount > 1) {
            let toast = this.toastCtrl.create({
                message: 'We found ' + this.resultsCount + ' Barbers, scroll down to view more',
                duration: 2500,
                position: 'top',
                showCloseButton: true,
                closeButtonText: 'Ok'
            });

            toast.onDidDismiss(() => {
                console.log('Dismissed toast');
            });

            toast.present();
        }
    }
    public selectTime(start, end, barber_name, barber_id, barber) {
        GoogleAnalytics.trackEvent('Time', 'Selected', 'Selected Time');
        this.slotStart = start;
        this.slotEnd = end;
        this.barberName = barber_name;
        this.barberId = barber_id;
        this.barberarray = barber;
    }
    // presentProfileModal(barber) {
    //     GoogleAnalytics.trackEvent('Profile', 'Clicked', 'Clicked on barber');
    //     let profileModal = this.modalCtrl.create(Profile, { barber });
    //     profileModal.present();
    // }
    navConfirm() {
        if (!this.slotStart || this.slotStart === '' || this.slotStart === null || this.slotStart === 'None Selected') {
            this.alertCtrl.create({ title: 'Whoops', subTitle: 'You must select a time slot' }).present();
            console.log('no address entered');
            return;
        }
        else {
            let what = 'Hair Cut';
            // this.navCtrl.push(Confirmation, { start: this.slotStart, end: this.slotEnd, barberId: this.barberId, what: what, where: this.address, barber: this.barberarray, price: this.price, displayprice: this.displayprice, qty: this.qty });
        }
    }
}
