import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ResponseMessage } from '../../utils/enum';
export class LoginPayload {
  @IsEmail()
  @IsNotEmpty()
  @Matches(
    /^[a-zA-Z]+[a-zA-Z0-9_\.\-]*[a-zA-Z0-9]+\@(([a-zA-Z0-9\-]){3,30}\.)+([a-zA-Z0-9]{2,5})$/,
    { message: ResponseMessage.INVALID_EMAIL },
  )
  @Matches(/^(?!.*[\-\_\.]{2}).*$/, { message: ResponseMessage.INVALID_EMAIL })
  email: string;

  @IsNotEmpty()
  @MinLength(8, { message: ResponseMessage.INVALID_PASSWORD })
  @MaxLength(15, { message: ResponseMessage.INVALID_PASSWORD })
  @Matches(/(?=.*\d)(?=.*\W+)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ResponseMessage.INVALID_PASSWORD,
  })
  password: string;
}
