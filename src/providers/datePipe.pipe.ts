import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'customdate'
})
export class CustomDatePipe implements PipeTransform {
    transform(value: string, arg: string): string {
        return moment(value).format(arg);
    }
}