import { IsNotEmpty } from 'class-validator';
export class LoginPayload {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
