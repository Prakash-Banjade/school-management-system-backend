import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { isFuture } from 'date-fns';


@ValidatorConstraint({ async: false })
class IsFutureDateConstraint implements ValidatorConstraintInterface {
    validate(date: string, args: ValidationArguments) {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return false;

        return isFuture(dateObj);
    }

    defaultMessage(args: ValidationArguments) {
        return 'The date must be in the future.';
    }
}


/**
 * @description Checks if the date is in the future. Accepts today.
 */
export function IsFutureDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsFutureDateConstraint,
        });
    };
}
