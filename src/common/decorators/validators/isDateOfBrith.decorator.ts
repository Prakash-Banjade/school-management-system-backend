import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isValid, differenceInYears, parseISO } from 'date-fns';

export function IsDateOfBirth(minAge: number, maxAge: number, validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsDateOfBirth',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [minAge, maxAge],
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    const [minAge, maxAge] = args.constraints;

                    try {
                        // Parse and validate the date
                        const date = parseISO(value);
                        if (!isValid(date)) {
                            return false;
                        }

                        // Calculate the age
                        const currentAge = differenceInYears(new Date(), date);

                        // Ensure the age falls within the specified range
                        return currentAge >= minAge && currentAge <= maxAge;
                    } catch {
                        return false;
                    }
                },
                defaultMessage(args: ValidationArguments) {
                    const [minAge, maxAge] = args.constraints;
                    return `The date of birth must result in an age between ${minAge} and ${maxAge} years.`;
                },
            },
        });
    };
}
