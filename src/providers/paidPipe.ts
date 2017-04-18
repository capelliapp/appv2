import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'paid'
})
export class BoolToString implements PipeTransform {
    transform(value: number): string {
        if (value === 1) {
            return 'Paid';
        }
        else return 'Unpaid';
    }
}