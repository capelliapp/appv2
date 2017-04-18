import { ValidatorFn, AbstractControl } from '@angular/forms';

// interface ValidationResult {
//     [key: string]: boolean;
// }

export class EmailValidator {

    public static isValid(): ValidatorFn {
        var emailReg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        // let valid = emailReg.test(control.value);

        // if (!valid) {
        //     return { isValid: true };
        // }
        // return null;

        return (control: AbstractControl): { [key: string]: any } => {
            const email = control.value;
            const isValid = emailReg.test(email);
            return isValid ? { 'isValid': { email } } : null;
        };
    }
}
