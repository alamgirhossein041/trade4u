import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { Unique } from './../common';
import { SameAs } from './../common/validator/same-as.validator';
import { User } from './../user';

export class RegisterPayload {
  @IsEmail()
  @Unique([User])
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
