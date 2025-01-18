import { registerDecorator, ValidationOptions, ValidationArguments, isEmail } from 'class-validator';

export function IsOptionalEmail(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isOptionalEmail',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    // If value is undefined or null, it’s considered optional
                    if (value === undefined || value === null || value === '') {
                        return true;
                    }
                    // Validate as email if value is present
                    return typeof value === 'string' && isEmail(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} must be a valid email address if provided`;
                },
            },
        });
    };
}
