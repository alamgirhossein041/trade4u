import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginPayload {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(5)
  password: string;
}
