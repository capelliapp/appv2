import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'toprice'
})
export class ToPricePipe implements PipeTransform {
    transform(value: number): number {
        return value / 100;
    }
}

@Pipe({
    name: 'fill'
})
export class FillPipe implements PipeTransform {
    transform(value) {
        return (new Array(value)).fill(1);
    }
}

@Pipe({
    name: 'status'
})
export class StatusPipe implements PipeTransform {
    transform(value: string): string {
        let newValue: string = '';
        switch (value) {
            case 'tentative':
                newValue = 'Waiting for barber';
                break;
            case 'confirm':
                newValue = 'Confirmed';
                break;
            case 'decline':
                newValue = 'Declined';
                break;
            case 'cancel':
                newValue = 'Cancelled';
                break;
            case 'complete':
                newValue = 'Completed';
                break;
            default: newValue = 'Waiting for barber';
        }
        return newValue;

    }
}


@Pipe({
    name: 'barberstatus'
})
export class BarberStatusPipe implements PipeTransform {
    transform(value: string): string {
        let newValue: string = '';
        switch (value) {
            case 'tentative':
                newValue = 'Please confirm';
                break;
            case 'confirm':
                newValue = 'Confirmed';
                break;
            case 'decline':
                newValue = 'Declined';
                break;
            case 'cancel':
                newValue = 'Cancelled';
                break;
            case 'complete':
                newValue = 'Completed';
                break;
            default: newValue = 'Please confirm';
        }
        return newValue;

    }
}
