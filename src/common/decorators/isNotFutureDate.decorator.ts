import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
    validate(date: string): boolean {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return false;
        
        const today = new Date();
        today.setDate(today.getDate() + 1); // Add 1 day to today's date
        today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate date comparison
        return dateObj <= today;
    }

    defaultMessage(): string {
        return 'The date should not be in the future';
    }
}

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsNotFutureDateConstraint,
        });
    };
}
