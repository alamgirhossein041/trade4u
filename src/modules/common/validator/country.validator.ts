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

@ValidatorConstraint({ name: 'ValidCountry', async: true })
@Injectable()
export class CountryValidator implements ValidatorConstraintInterface {
  constructor() {}
  async validate(value: string) {
    try {
      const valid = Country.getAllCountries().findIndex(
        (c) => c.name === value,
      );
      return valid > -1 ? true : false;
    } catch (e) {
      return false;
    }
  }

  // defaultMessage(args: ValidationArguments) {
  //   return ResponseMessage.INVALID_COUNTRY;
  // }
}

export function IsValidCountry(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'ValidCountry',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: CountryValidator,
    });
  };
}
