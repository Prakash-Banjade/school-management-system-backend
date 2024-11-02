import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { isUUID, isURL } from 'class-validator';

const BACKEND_URL = process.env.BACKEND_URL;

@ValidatorConstraint({ async: false })
export class IsUuidOrUrlConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
        if (typeof value !== 'string') return false;
        
        return isUUID(value) || value.startsWith(BACKEND_URL);
    }

    defaultMessage(args: ValidationArguments) {
        return 'The value must be either a valid UUID or a valid URL';
    }
}

export function IsUuidOrUrl(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUuidOrUrlConstraint,
        });
    };
}
