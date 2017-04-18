import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
    name: 'fromnow'
})
export class FromNowPipe implements PipeTransform {
    transform(value: string): string {
        return moment(value).fromNow();
    }
}