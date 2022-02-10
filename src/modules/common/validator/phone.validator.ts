import { Injectable } from '@nestjs/common';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Country, State, City } from 'country-state-city';
import { ResponseMessage } from '../../../utils/enum';
import { isValidPhoneNumber } from 'libphonenumber-js';

@ValidatorConstraint({ name: 'ValidCountry', async: true })
@Injectable()
export class PhoneNumberValidator implements ValidatorConstraintInterface {
  constructor() {}
  async validate(value: string, args: any) {
    try {
      const country = Country.getAllCountries().find(
        (c) => c.name === args.object.country,
      );
      return isValidPhoneNumber(value, { defaultCallingCode: country.isoCode });
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return ResponseMessage.INVALID_PHONE_NUMBER;
  }
}

export function IsValidPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'ValidPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: PhoneNumberValidator,
    });
  };
}
