import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { SameAs } from './../common/validator/same-as.validator';

export class RegisterPayload {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @SameAs('password')
  passwordConfirmation: string;
}
