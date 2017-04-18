import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'tobalance'
})
export class ToBalancePipe implements PipeTransform {
    transform(value: number): number {
        return value * -1 / 100;
    }
}